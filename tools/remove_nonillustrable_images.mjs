#!/usr/bin/env node

// Removes images only where a single visual cannot reliably teach the meaning:
// adverbs, idioms, grammatical phrases, and selected abstract expressions.

import { readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseImageToolOptions } from './image_tool_options.mjs';

const { root, outputDir, imageDir } = parseImageToolOptions({ extraUsage: ' [--rules <file.json>]' });

let nonIllustrableTypes = new Set(['adverb', 'phrase', 'adjective phrase', 'prepositional phrase', 'preposition', 'sentence']);
let nonIllustrableWords = new Set([
  // Idioms, grammatical verb phrases, and relations without a stable visual.
  'be confined to', 'cling to life', 'account for', 'start from a very low base',
  'to be destined for', 'take hold', 'run a close second to', 'contribute to',
  'weigh up', 'act as', 'arrive at', 'be on high alert', 'tense up', 'take in',
  'hold on', 'make up', 'take advantage of', 'make use of', 'put off',
  'break this habit', 'let down', 'put together', 'get on with', 'engage in',
  'be closely linked with', 'correlate with', 'occupy one\'s mind', 'break the cycle',
  'take the edge off', 'refer to', 'announce the call', 'take place', 'tasked with',
  'rule out', 'get the technology right', 'move away from', 'run through',
  'take the hard choice of living out of life', 'kill time',
  'take a dissenting stance towards something', 'afford to', 'consist of',
  'put the final touches', 'carry out', 'be composed of', 'stem from', 'point out',
  'carve out', 'stay true to something', 'make one\'s way', 'derive something from',
  'adapt to', 'start out', 'fight against', 'participate in', 'save from',
  // Abstract noun phrases and figurative descriptions.
  'mood management', 'emotion regulation', 'prime candidates for', 'mood boost',
  'sense of guilt', 'cost of', 'toll on', 'fraudulent excuse', 'a measure of',
  'destructive coping strategy', 'route out of', 'animating force', 'potential fix',
  'judgment call', 'instant success', 'pressing need', 'ups and downs',
  'a wealth of', 'matter of life and death', 'mere presence',
  // Abstract adjectives: their visual form is too subjective to reinforce the
  // definition reliably in an Anki card.
  'subsequent', 'insufficient', 'significant', 'prominent', 'ingrained',
  'unsurprising', 'determined', 'precarious', 'resistant', 'tolerant',
  'susceptible', 'wary', 'adverse', 'optimistic', 'hyper-vigilant', 'alarming',
  'demanding', 'collective', 'justified', 'rewarding', 'chronic', 'vicious',
  'evidence-based', 'critical', 'imaginary', 'countless', 'near-perfect',
  'precise', 'unforgiving', 'pedantic', 'legalistic', 'lacking', 'weird',
  'aesthetic', 'enormous', 'efficient', 'abundant', 'world-renowned', 'diverse',
  'mind-blowing', 'urgent', 'benign', 'analogous', 'inaccessible', 'dubious',
  'genuine', 'guilty', 'sophisticated', 'underemployed', 'frustrated',
  'ambitious', 'intrinsic', 'autonomous', 'so-called', 'contrary', 'malicious',
  'first-rate', 'second-rate', 'stimulating', 'remarkable', 'dystopian',
  'clear cut', 'frightened', 'abstract', 'keen', 'subtle', 'innovative',
  'avant-garde', 'celebrated', 'soaring', 'inspirational', 'daring', 'extended',
  'lasting', 'immediate', 'exotic', 'expansive', 'monumental', 'unproductive',
  'extreme', 'thriving', 'overlooked', 'favourable', 'moderate',
  'single-solution', 'multifunctional', 'suited', 'widespread', 'unexpected',
  'sufficient', 'initial', 'self-reported', 'unintended', 'harmonious',
  // Abstract nouns, measures, mental states, and broad concepts.
  'lifespan', 'descent', 'initiative', 'mortality', 'optimism', 'stakeholder',
  'diameter', 'specimen', 'tolerance', 'resistance', 'component', 'advocate',
  'prospect', 'analogue', 'likelihood', 'fraud', 'pattern', 'cortisol', 'hazard',
  'evolution', 'pulse', 'stocks', 'agent', 'leftover', 'sense', 'buoyancy',
  'contraction', 'capture', 'entanglement', 'judgment', 'detection',
  'self-esteem', 'tendency', 'misconduct', 'behaviour', 'outcome', 'survey',
  'well-being', 'personality', 'trait', 'demographics', 'distraction',
  'compassion', 'consensus', 'controversy', 'dimension', 'commission',
  'precision', 'application', 'discretion', 'movement', 'accuracy', 'means',
  'consumption', 'appeal', 'preservation', 'division', 'innovation', 'consumer',
  'turnover', 'comparison', 'threat', 'wonder', 'crisis', 'restoration',
  'cosmology', 'astrophysics', 'fabrication', 'status', 'anthropology', 'spirit',
  'successor', 'surroundings', 'reliability', 'flexibility', 'representation',
  'consequence', 'futurologist', 'singularity', 'welfare', 'capacity', 'misuse',
  'supremacy', 'spectrum', 'reality', 'fantasy', 'separation', 'understanding',
  'perspective', 'vision', 'finesse', 'nuance', 'encouragement', 'reputation',
  'inspiration', 'imagination', 'variation', 'contrast', 'clarity', 'arrangement',
  'motif', 'feat', 'legacy', 'adaptation', 'mitigation', 'sustainability',
  'strategy', 'transition', 'modification', 'elevation', 'salinity', 'variety',
  'revival', 'performance', 'conservation', 'fate', 'extent', 'coexistence',
  // Verbs whose listed sense is conceptual, evaluative, or too broad to show.
  'occupy', 'form', 'offset', 'prompt', 'renew', 'succumb', 'unfold', 'vary',
  'perceive', 'convey', 'estimate', 'embrace', 'induce', 'sense', 'favour',
  'undergo', 'compose', 'procrastinate', 'evaluate', 'condition', 'reinforce',
  'commission', 'evolve', 'brainstorm', 'appreciate', 'maximize', 'innovate',
  'establish', 'represent', 'highlight', 'dismiss', 'assist', 'exploit', 'impose',
  'outstrip', 'arise', 'fret', 'personify', 'outwit', 'surpass', 'process',
  'outweigh', 'persist', 'envisage', 'shift', 'enliven', 'determine', 'impress',
  'promote', 'inspire', 'emphasize', 'reflect', 'hinder', 'forecast',
  'exacerbate', 'dampen', 'mimic', 'embed', 'retrofit', 'indicate', 'rate',
  'obtain', 'compete', 'deliver',
]);

function parse(content) {
  return { trailingNewline: content.endsWith('\n'), rows: content.split(/\r?\n/).filter(Boolean).map(line => line.split('\t')) };
}

function serialize(parsed) {
  return parsed.rows.map(row => row.join('\t')).join('\n') + (parsed.trailingNewline ? '\n' : '');
}

function shouldRemove(word, type) {
  return nonIllustrableTypes.has(type) || nonIllustrableWords.has(word);
}

async function loadOptionalRules() {
  const index = process.argv.indexOf('--rules');
  if (index < 0) return;
  const rulePath = process.argv[index + 1];
  if (!rulePath || rulePath.startsWith('--')) throw new Error('--rules requires a JSON file with optional "types" and "words" arrays.');
  const customRules = JSON.parse(await readFile(path.resolve(root, rulePath), 'utf8'));
  if (!Array.isArray(customRules.types) && !Array.isArray(customRules.words)) throw new Error('Rule JSON must contain a "types" array, a "words" array, or both.');
  // A supplied rule file deliberately replaces the built-in example rules.
  nonIllustrableTypes = new Set(customRules.types ?? []);
  nonIllustrableWords = new Set(customRules.words ?? []);
}

async function main() {
  await loadOptionalRules();
  const names = (await readdir(outputDir)).filter(name => name.endsWith('.txt')).sort();
  const parsedFiles = new Map();
  const clearedImages = new Set();
  const removedWords = new Set();

  for (const name of names) {
    const filePath = path.join(outputDir, name);
    const parsed = parse(await readFile(filePath, 'utf8'));
    const isChoice = name.startsWith('CHOICE-');
    const expectedColumns = isChoice ? 19 : 14;
    const wordColumn = isChoice ? 7 : 2;
    const typeColumn = isChoice ? 8 : 3;
    const imageColumn = isChoice ? 14 : 9;
    let changed = false;
    for (const row of parsed.rows) {
      if (row.length !== expectedColumns) throw new Error(`${name} has a row with ${row.length} columns`);
      if (row[imageColumn] && shouldRemove(row[wordColumn], row[typeColumn])) {
        clearedImages.add(row[imageColumn]);
        removedWords.add(row[wordColumn]);
        row[imageColumn] = '';
        changed = true;
      }
    }
    parsedFiles.set(name, { filePath, parsed, changed, isChoice });
  }

  for (const { filePath, parsed, changed } of parsedFiles.values()) if (changed) await writeFile(filePath, serialize(parsed), 'utf8');

  // An image can only be removed if no remaining record in this group uses it.
  const referenced = new Set();
  for (const { parsed, isChoice } of parsedFiles.values()) {
    const imageColumn = isChoice ? 14 : 9;
    for (const row of parsed.rows) if (row[imageColumn]) referenced.add(row[imageColumn]);
  }
  let filesRemoved = 0;
  for (const imageName of clearedImages) {
    if (referenced.has(imageName)) continue;
    const imagePath = path.join(imageDir, imageName);
    try { await stat(imagePath); await rm(imagePath); filesRemoved++; } catch {}
  }

  console.log(`Cleared image fields for ${removedWords.size} vocabulary items and removed ${filesRemoved} unreferenced JPEGs.`);
}

await main();
