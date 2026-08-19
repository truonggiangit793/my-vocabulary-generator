import fs from 'node:fs';
import path from 'node:path';

const root = '/Users/truonggiangit793/Desktop/my-vocabulary-generator';
const dir = path.join(root, 'output/vietnamese-foods-vegetables');
const [word, filename] = process.argv.slice(2);
if (!word || !filename) throw new Error('Usage: node tools/update_vie_food_images.mjs "word" "filename.jpg"');

const choicePath = path.join(dir, 'CHOICE-foods.txt');
const fillPath = path.join(dir, 'FILL-foods.txt');

function update(file, index) {
  const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  let changed = 0;
  const out = rows.map(line => {
    const fields = line.split('\t');
    if (fields[index] === word) { fields[index === 7 ? 14 : 9] = filename; changed++; }
    return fields.join('\t');
  });
  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
  return changed;
}

const c = update(choicePath, 7);
const f = update(fillPath, 2);
if (c !== 1 || f !== 1) throw new Error(`Expected one row in each file for ${word}; changed Choice=${c}, Fill=${f}`);
console.log(`Updated ${word}: ${filename}`);
