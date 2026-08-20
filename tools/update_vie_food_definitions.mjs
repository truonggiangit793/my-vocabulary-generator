import fs from 'node:fs';
import path from 'node:path';
import { vegetableDefinitions } from './vie_vegetable_definitions.mjs';

const root = '/Users/truonggiangit793/Desktop/my-vocabulary-generator';
const outputDir = path.join(root, 'output/vietnamese-foods-vegetables');
const choicePath = path.join(outputDir, 'CHOICE-vegetables.txt');
const fillPath = path.join(outputDir, 'FILL-vegetables.txt');
const updates = new Map(Object.entries(vegetableDefinitions));

function updateFile(filePath, wordColumn, definitionColumns) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);
  let updated = 0;
  const output = lines.map(line => {
    if (!line) return line;
    const fields = line.split('\t');
    const word = fields[wordColumn];
    const definition = updates.get(word);
    if (!definition) return line;
    for (const column of definitionColumns) fields[column] = definition;
    updated += 1;
    return fields.join('\t');
  }).join('\n');
  fs.writeFileSync(filePath, output, 'utf8');
  return updated;
}

const choiceUpdated = updateFile(choicePath, 7, [1, 12]);
const fillUpdated = updateFile(fillPath, 2, [7]);
const expected = updates.size;

if (choiceUpdated !== expected || fillUpdated !== expected) {
  throw new Error(`Definition update incomplete: expected ${expected}, Choice ${choiceUpdated}, Fill ${fillUpdated}`);
}

console.log(`Updated ${choiceUpdated} Choice definitions and ${fillUpdated} Fill definitions.`);
