#!/usr/bin/env node

// Fetch one broadly illustrative image for every vocabulary item whose image
// field is empty. The TSV files are updated only
// after the corresponding JPEG has been written successfully.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseImageToolOptions } from './image_tool_options.mjs';

const { root, outputDir, imageDir, reportPrefix } = parseImageToolOptions();
const openverseApi = 'https://api.openverse.org/v1/images';
const concurrency = 3;

function slug(word) {
  const base = word.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 180) || 'image';
  return base;
}

function fileName(word, used) {
  const base = slug(word);
  let name = `${base}.jpg`;
  if (used.has(name)) {
    name = `${base}-${createHash('sha1').update(word).digest('hex').slice(0, 8)}.jpg`;
  }
  used.add(name);
  return name;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'anki-vocabulary-image-fetcher/1.0' } });
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  return response.json();
}

async function lookupImage(word) {
  // Flickr has a reliable public image CDN and Openverse indexes only openly
  // licensed material. It also prevents rapid requests to one Wikimedia host.
  const query = new URLSearchParams({ q: word, page_size: '5', source: 'flickr' });
  const data = await fetchJson(`${openverseApi}?${query}`);
  const candidates = (data.results ?? []).filter(item => item.url && /^https:\/\/live\.staticflickr\.com\//.test(item.url));
  // Prefer landscape images without requiring a fixed aspect ratio. Fall back
  // to another valid result when Openverse has no landscape candidate.
  const image = candidates.find(item => item.width && item.height && item.width >= item.height) ?? candidates[0];
  return image ? {
    url: image.url,
    source: image.foreign_landing_url,
    attribution: image.attribution,
    license: `${image.license ?? ''}-${image.license_version ?? ''}`,
  } : null;
}

async function downloadAsJpeg(url, destination) {
  const response = await fetch(url, { headers: { 'User-Agent': 'anki-vocabulary-image-fetcher/1.0' } });
  if (!response.ok) throw new Error(`image returned ${response.status}`);
  const tmp = `${destination}.download`;
  await writeFile(tmp, Buffer.from(await response.arrayBuffer()));
  try {
    execFileSync('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '85', tmp, '--out', destination], { stdio: 'ignore' });
  } finally {
    await rm(tmp, { force: true });
  }
  if ((await stat(destination)).size < 1024) throw new Error('JPEG is unexpectedly small');
}

function rowsFrom(content) {
  const hasFinalNewline = content.endsWith('\n');
  const rows = content.split(/\r?\n/).filter(Boolean).map(line => line.split('\t'));
  return { rows, hasFinalNewline };
}

async function main() {
  await mkdir(imageDir, { recursive: true });
  const files = (await readdir(outputDir)).filter(name => name.startsWith('CHOICE-') && name.endsWith('.txt')).sort();
  const choiceFiles = [];
  const words = new Map();
  const choiceWords = new Set();
  const used = new Set();

  for (const file of files) {
    const fullPath = path.join(outputDir, file);
    const parsed = rowsFrom(await readFile(fullPath, 'utf8'));
    choiceFiles.push({ file, fullPath, ...parsed });
    for (const row of parsed.rows) {
      if (row.length !== 19) throw new Error(`${file} has a row with ${row.length} columns`);
      choiceWords.add(row[7]);
      if (row[14]) {
        used.add(row[14]);
        try { await stat(path.join(imageDir, row[14])); }
        catch { if (!words.has(row[7])) words.set(row[7], row[14]); }
      } else if (!words.has(row[7])) words.set(row[7], null);
    }
  }
  // A few historical Fill records have no matching Choice record. Include them
  // too so that every image field in the selected output group points to a local JPEG.
  for (const choice of files) {
    const fill = choice.replace(/^CHOICE-/, 'FILL-');
    const parsed = rowsFrom(await readFile(path.join(outputDir, fill), 'utf8'));
    for (const row of parsed.rows) {
      if (row.length !== 14) throw new Error(`${fill} has a row with ${row.length} columns`);
      if (!row[9] && !choiceWords.has(row[2]) && !words.has(row[2])) words.set(row[2], null);
    }
  }
  for (const [word, name] of words) if (!name) words.set(word, fileName(word, used));
  console.log(`Need images for ${words.size} unique vocabulary items.`);

  const entries = [...words.entries()];
  const failures = [];
  const sources = [];
  let next = 0;
  async function worker() {
    while (next < entries.length) {
      const index = next++;
      const [word, name] = entries[index];
      const destination = path.join(imageDir, name);
      try {
        try { if ((await stat(destination)).size >= 1024) { console.log(`[${index + 1}/${entries.length}] exists ${name}`); continue; } } catch {}
        const source = await lookupImage(word);
        if (!source) throw new Error('no suitable Openverse/Flickr image result');
        await downloadAsJpeg(source.url, destination);
        sources.push({ word, name, ...source });
        console.log(`[${index + 1}/${entries.length}] saved ${name}`);
      } catch (error) {
        await rm(destination, { force: true });
        failures.push({ word, name, error: error.message });
        console.error(`[${index + 1}/${entries.length}] failed ${word}: ${error.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const failedWords = new Set(failures.map(item => item.word));
  const saved = new Map([...words].filter(([word]) => !failedWords.has(word)));
  for (const item of choiceFiles) {
    let changed = false;
    for (const row of item.rows) {
      if (!row[14] && saved.has(row[7])) { row[14] = saved.get(row[7]); changed = true; }
    }
    if (changed) await writeFile(item.fullPath, item.rows.map(row => row.join('\t')).join('\n') + (item.hasFinalNewline ? '\n' : ''), 'utf8');
  }

  const imageByWord = new Map();
  for (const item of choiceFiles) for (const row of item.rows) if (row[14]) imageByWord.set(row[7], row[14]);
  for (const [word, name] of saved) imageByWord.set(word, name);

  // The corresponding Fill files use their answer in column 3 and image in column 10.
  for (const choice of files) {
    const fill = choice.replace(/^CHOICE-/, 'FILL-');
    const fullPath = path.join(outputDir, fill);
    const parsed = rowsFrom(await readFile(fullPath, 'utf8'));
    let changed = false;
    for (const row of parsed.rows) {
      if (row.length !== 14) throw new Error(`${fill} has a row with ${row.length} columns`);
      if (!row[9] && imageByWord.has(row[2])) { row[9] = imageByWord.get(row[2]); changed = true; }
    }
    if (changed) await writeFile(fullPath, parsed.rows.map(row => row.join('\t')).join('\n') + (parsed.hasFinalNewline ? '\n' : ''), 'utf8');
  }

  if (failures.length) {
    await writeFile(path.join(root, `${reportPrefix}-image-download-failures.tsv`), failures.map(x => `${x.word}\t${x.name}\t${x.error}`).join('\n') + '\n');
  }
  if (sources.length) {
    await writeFile(path.join(root, `${reportPrefix}-image-sources.tsv`), ['word', 'filename', 'source', 'license', 'attribution'].join('\t') + '\n' + sources.map(x => [x.word, x.name, x.source, x.license, x.attribution].join('\t')).join('\n') + '\n');
  }
  console.log(`Completed: ${entries.length - failures.length} saved, ${failures.length} failed.`);
}

await main();
