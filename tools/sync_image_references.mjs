#!/usr/bin/env node

// Synchronize existing local image references between corresponding Choice
// and Fill records. This is intentionally local-only: it never downloads,
// renames, or rewrites image files. A filename is copied only when the other
// side is empty or contains a non-local/invalid value.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function usage() {
  return 'Usage: node sync_image_references.mjs --output-dir <directory>';
}

function valueFor(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function isValidLocalFilename(value) {
  return Boolean(value)
    && !/^https?:\/\//i.test(value)
    && path.basename(value) === value
    && /\.jpg$/i.test(value);
}

function parse(content, name, expectedColumns) {
  const trailingNewline = content.endsWith('\n');
  const rows = content.split(/\r?\n/).filter(Boolean).map(line => line.split('\t'));
  for (const row of rows) {
    if (row.length !== expectedColumns) throw new Error(`${name} has a row with ${row.length} columns`);
  }
  return { rows, trailingNewline };
}

function serialize(parsed) {
  return parsed.rows.map(row => row.join('\t')).join('\n') + (parsed.trailingNewline ? '\n' : '');
}

function keyFor(word, definition, vietnamese) {
  return [word, definition, vietnamese].join('\u0000');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage());
    return;
  }
  const outputValue = valueFor(args, '--output-dir');
  if (!outputValue || outputValue.startsWith('--')) throw new Error(`${usage()}\n\n--output-dir is required.`);

  const outputDir = path.resolve(process.cwd(), outputValue);
  const choiceNames = (await readdir(outputDir))
    .filter(name => name.startsWith('CHOICE-') && name.endsWith('.txt'))
    .sort();
  let updatedFiles = 0;
  let synchronized = 0;
  const conflicts = [];

  for (const choiceName of choiceNames) {
    const fillName = choiceName.replace(/^CHOICE-/, 'FILL-');
    const choicePath = path.join(outputDir, choiceName);
    const fillPath = path.join(outputDir, fillName);
    const choice = parse(await readFile(choicePath, 'utf8'), choiceName, 19);
    const fill = parse(await readFile(fillPath, 'utf8'), fillName, 14);
    const choiceByKey = new Map();
    const fillByKey = new Map();

    for (const row of choice.rows) {
      const key = keyFor(row[7], row[12], row[13]);
      if (!choiceByKey.has(key)) choiceByKey.set(key, []);
      choiceByKey.get(key).push(row);
    }
    for (const row of fill.rows) {
      const key = keyFor(row[2], row[7], row[8]);
      if (!fillByKey.has(key)) fillByKey.set(key, []);
      fillByKey.get(key).push(row);
    }

    let choiceChanged = false;
    let fillChanged = false;
    for (const [key, choiceRows] of choiceByKey) {
      const fillRows = fillByKey.get(key) ?? [];
      for (const choiceRow of choiceRows) {
        for (const fillRow of fillRows) {
          const choiceImage = choiceRow[14];
          const fillImage = fillRow[9];
          const choiceValid = isValidLocalFilename(choiceImage);
          const fillValid = isValidLocalFilename(fillImage);
          if (choiceValid && fillValid && choiceImage !== fillImage) {
            conflicts.push(`${choiceName} / ${fillName}: ${choiceRow[7]} => ${choiceImage} vs ${fillImage}`);
            continue;
          }
          if (choiceValid && !fillValid) {
            fillRow[9] = choiceImage;
            fillChanged = true;
            synchronized += 1;
          } else if (fillValid && !choiceValid) {
            choiceRow[14] = fillImage;
            choiceChanged = true;
            synchronized += 1;
          }
        }
      }
    }

    if (choiceChanged) {
      await writeFile(choicePath, serialize(choice), 'utf8');
      updatedFiles += 1;
    }
    if (fillChanged) {
      await writeFile(fillPath, serialize(fill), 'utf8');
      updatedFiles += 1;
    }
  }

  for (const conflict of conflicts) console.error(`CONFLICT ${conflict}`);
  console.log(`Synchronized ${synchronized} image references across ${updatedFiles} files.`);
  if (conflicts.length) {
    console.error(`Found ${conflicts.length} filename conflict(s); existing filenames were preserved.`);
    process.exitCode = 2;
  }
}

await main();
