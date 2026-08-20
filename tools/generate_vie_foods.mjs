import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { vegetableDefinition as detailedVegetableDefinition } from './vie_vegetable_definitions.mjs';

const root = '/Users/truonggiangit793/Desktop/my-vocabulary-generator';
const inputArg = process.argv[2] || 'input/vietnamese-foods-vegetables/foods.txt';
const inputPath = path.resolve(root, inputArg);
const outDir = path.join(root, 'output/vietnamese-foods-vegetables');
const idStem = process.argv[3] || 'VIE-FOODS';
const outputStem = process.argv[4] || path.basename(inputPath, path.extname(inputPath));
const isVegetableList = idStem === 'VIE-VEGETABLES';

const ipa = {
  beef: ['/biːf/', '/biːf/'], pho: ['/fɜː/', '/fɑː/'], chicken: ['/ˈtʃɪk.ɪn/', '/ˈtʃɪk.ən/'],
  vietnamese: ['/ˌvjet.nəˈmiːz/', '/ˌviː.et.nəˈmiːz/'], baguette: ['/bæˈɡet/', '/bæˈɡet/'], sandwich: ['/ˈsæn.wɪtʃ/', '/ˈsæn.wɪtʃ/'],
  hanoi: ['/hæˈnɔɪ/', '/hæˈnɔɪ/'], grilled: ['/ɡrɪld/', '/ɡrɪld/'], pork: ['/pɔːk/', '/pɔːrk/'], rice: ['/raɪs/', '/raɪs/'],
  vermicelli: ['/ˌvɜː.mɪˈtʃel.i/', '/ˌvɝː.məˈtʃel.i/'], bun: ['/buːn/', '/buːn/'], cha: ['/tʃɑː/', '/tʃɑː/'], soup: ['/suːp/', '/suːp/'],
  noodle: ['/ˈnuː.dəl/', '/ˈnuː.dəl/'], noodles: ['/ˈnuː.dəlz/', '/ˈnuː.dəlz/'], steamed: ['/stiːmd/', '/stiːmd/'], rolls: ['/rəʊlz/', '/roʊlz/'],
  turmeric: ['/ˈtɜː.mər.ɪk/', '/ˈtɝː.mər.ɪk/'], fish: ['/fɪʃ/', '/fɪʃ/'], dill: ['/dɪl/', '/dɪl/'], fried: ['/fraɪd/', '/fraɪd/'], tofu: ['/ˈtəʊ.fuː/', '/ˈtoʊ.fuː/'],
  shrimp: ['/ʃrɪmp/', '/ʃrɪmp/'], paste: ['/peɪst/', '/peɪst/'], crab: ['/kræb/', '/kræb/'], meatball: ['/ˈmiːt.bɔːl/', '/ˈmiːt.bɔːl/'], meatballs: ['/ˈmiːt.bɔːlz/', '/ˈmiːt.bɔːlz/'],
  eel: ['/iːl/', '/iːl/'], glass: ['/ɡlɑːs/', '/ɡlæs/'], sticky: ['/ˈstɪk.i/', '/ˈstɪk.i/'], mung: ['/mʌŋ/', '/mʌŋ/'], bean: ['/biːn/', '/biːn/'], beans: ['/biːnz/', '/biːnz/'],
  pyramid: ['/ˈpɪr.ə.mɪd/', '/ˈpɪr.ə.mɪd/'], dumpling: ['/ˈdʌm.plɪŋ/', '/ˈdʌm.plɪŋ/'], dumplings: ['/ˈdʌm.plɪŋz/', '/ˈdʌm.plɪŋz/'], northern: ['/ˈnɔː.ðən/', '/ˈnɔːr.ðɚn/'], spring: ['/sprɪŋ/', '/sprɪŋ/'],
  rolls: ['/rəʊlz/', '/roʊlz/'], hue: ['/hjuː/', '/hjuː/'], quang: ['/kwɑːŋ/', '/kwɑːŋ/'], hoi: ['/hɔɪ/', '/hɔɪ/'], an: ['/æn/', '/æn/'], clam: ['/klæm/', '/klæm/'],
  cakes: ['/keɪks/', '/keɪks/'], cake: ['/keɪk/', '/keɪk/'], tapioca: ['/ˌtæp.iˈəʊ.kə/', '/ˌtæp.iˈoʊ.kə/'], flat: ['/flæt/', '/flæt/'], glutinous: ['/ˈɡluː.tən.əs/', '/ˈɡluː.tən.əs/'], crispy: ['/ˈkrɪs.pi/', '/ˈkrɪs.pi/'],
  lemongrass: ['/ˈlem.ən.ɡrɑːs/', '/ˈlem.ən.ɡræs/'], skewers: ['/ˈskjuː.əz/', '/ˈskjuː.ɚz/'], thick: ['/θɪk/', '/θɪk/'], anchovy: ['/ˈæn.tʃə.vi/', '/ˈæn.tʃə.vi/'], anchovies: ['/ˈæn.tʃə.viz/', '/ˈæn.tʃə.viz/'],
  fermented: ['/fəˈmen.tɪd/', '/fɚˈmen.tɪd/'], sugarcane: ['/ˈʃʊɡ.ə.keɪn/', '/ˈʃʊɡ.ɚ.keɪn/'], belly: ['/ˈbel.i/', '/ˈbel.i/'], wrapped: ['/ræpt/', '/ræpt/'], fine: ['/faɪn/', '/faɪn/'], offal: ['/ˈɒf.əl/', '/ˈɔː.fəl/'],
  broken: ['/ˈbrəʊ.kən/', '/ˈbroʊ.kən/'], southern: ['/ˈsʌð.ən/', '/ˈsʌð.ɚn/'], fresh: ['/freʃ/', '/freʃ/'], sizzling: ['/ˈsɪz.əl.ɪŋ/', '/ˈsɪz.əl.ɪŋ/'], pancake: ['/ˈpæn.keɪk/', '/ˈpæn.keɪk/'], pancakes: ['/ˈpæn.keɪks/', '/ˈpæn.keɪks/'],
  mini: ['/ˈmɪn.i/', '/ˈmɪn.i/'], hotpot: ['/ˈhɒt.pɒt/', '/ˈhɑːt.pɑːt/'], sour: ['/saʊər/', '/saʊr/'], caramelized: ['/ˈkær.ə.məl.aɪzd/', '/ˈkær.ə.məl.aɪzd/'], caramelized: ['/ˈkær.ə.məl.aɪzd/', '/ˈkær.ə.məl.aɪzd/'], clay: ['/kleɪ/', '/kleɪ/'],
  stew: ['/stjuː/', '/stuː/'], stew: ['/stjuː/', '/stuː/'], beef: ['/biːf/', '/biːf/'], betel: ['/ˈbiː.təl/', '/ˈbiː.təl/'], leaves: ['/liːvz/', '/liːvz/'], lotus: ['/ˈləʊ.təs/', '/ˈloʊ.təs/'], stem: ['/stem/', '/stem/'], green: ['/ɡriːn/', '/ɡriːn/'], mango: ['/ˈmæŋ.ɡəʊ/', '/ˈmæŋ.ɡoʊ/'],
  savory: ['/ˈseɪ.vər.i/', '/ˈseɪ.vɚ.i/'], three: ['/θriː/', '/θriː/'], colour: ['/ˈkʌl.ər/', '/ˈkʌl.ɚ/'], dessert: ['/dɪˈzɜːt/', '/dɪˈzɝːt/'], filled: ['/fɪld/', '/fɪld/'], ginger: ['/ˈdʒɪn.dʒər/', '/ˈdʒɪn.dʒɚ/'], banana: ['/bəˈnɑː.nə/', '/bəˈnæn.ə/'], black: ['/blæk/', '/blæk/'], lotus: ['/ˈləʊ.təs/', '/ˈloʊ.təs/'], seed: ['/siːd/', '/siːd/'], seeds: ['/siːdz/', '/siːdz/'],
  cylindrical: ['/sɪˈlɪn.drɪ.kəl/', '/səˈlɪn.drɪ.kəl/'], layer: ['/ˈleɪ.ər/', '/ˈleɪ.ɚ/'], baked: ['/beɪkt/', '/beɪkt/'], honeycomb: ['/ˈhʌn.i.kəʊm/', '/ˈhʌn.i.koʊm/'], pastry: ['/ˈpeɪ.stri/', '/ˈpeɪ.stri/'], durian: ['/ˈdʊə.ri.ən/', '/ˈdʊr.i.ən/'], salted: ['/ˈsɔːl.tɪd/', '/ˈsɑːl.tɪd/'], egg: ['/eɡ/', '/eɡ/'], eggs: ['/eɡz/', '/eɡz/'], paper: ['/ˈpeɪ.pər/', '/ˈpeɪ.pɚ/'], salad: ['/ˈsæl.əd/', '/ˈsæl.əd/'], pizza: ['/ˈpiːt.sə/', '/ˈpiːt.sə/'], bamboo: ['/ˌbæmˈbuː/', '/ˌbæmˈbuː/'], smoked: ['/sməʊkt/', '/smoʊkt/'], buffalo: ['/ˈbʌf.ə.ləʊ/', '/ˈbʌf.ə.loʊ/'], herb: ['/hɜːb/', '/ɝːb/'], stuffed: ['/stʌft/', '/stʌft/'], horse: ['/hɔːs/', '/hɔːrs/'], offal: ['/ˈɒf.əl/', '/ˈɔː.fəl/'], stew: ['/stjuː/', '/stuː/'], my: ['/maɪ/', '/maɪ/'], theo: ['/ˈθiː.əʊ/', '/ˈθiː.oʊ/'], curry: ['/ˈkʌr.i/', '/ˈkɜːr.i/'], sausage: ['/ˈsɒs.ɪdʒ/', '/ˈsɔː.sɪdʒ/'], herbal: ['/ˈhɜː.bəl/', '/ˈɝː.bəl/'], snail: ['/sneɪl/', '/sneɪl/'], jellyfish: ['/ˈdʒel.i.fɪʃ/', '/ˈdʒel.i.fɪʃ/'], quail: ['/kweɪl/', '/kweɪl/'], eggs: ['/eɡz/', '/eɡz/'], balut: ['/bəˈluːt/', '/bəˈluːt/'], corn: ['/kɔːn/', '/kɔːrn/'], sweet: ['/swiːt/', '/swiːt/'], potatoes: ['/pəˈteɪ.təʊz/', '/pəˈteɪ.toʊz/'], square: ['/skweər/', '/skwer/'], round: ['/raʊnd/', '/raʊnd/'], plain: ['/pleɪn/', '/pleɪn/'], ginger: ['/ˈdʒɪn.dʒər/', '/ˈdʒɪn.dʒɚ/'], molasses: ['/məˈlæs.ɪz/', '/məˈlæs.ɪz/'], pomegranate: ['/ˈpɒm.ɪ.ɡræn.ɪt/', '/ˈpɑː.mə.ɡræn.ɪt/'], jelly: ['/ˈdʒel.i/', '/ˈdʒel.i/'], coconut: ['/ˈkəʊ.kə.nʌt/', '/ˈkoʊ.kə.nʌt/'], chinese: ['/ˌtʃaɪˈniːz/', '/ˌtʃaɪˈniːz/'], duck: ['/dʌk/', '/dʌk/'], roast: ['/rəʊst/', '/roʊst/'],
};

const regionWords = /^(hanoi|hue|hoi an|nam pho|trang bang|phnom penh-style|my tho|phu quoc|hai phong|west lake|nha trang|chau doc|lang son|phan thiet|cau mong|binh dinh|ninh binh|central vietnamese|southern|northern)\s+/i;

function cleanPhrase(word) {
  return word.replace(regionWords, '').replace(/\bvietnamese\s+/i, '').replace(/-/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function ingredientText(word) {
  let p = cleanPhrase(word);
  p = p.replace(/\b(noodle soup|soup|hotpot|sweet soup|dessert|salad|spring rolls?|rolls?|pancakes?|cake|cakes|pastry|fritters?|sausage|stew|candy|cookies?|omelette|pudding|yogurt|ice cream|custard|porridge|congee|dumplings?|noodles?|vermicelli|sticky rice|rice)\b/gi, '').trim();
  p = p.replace(/\bwith\b/gi, 'with').replace(/\band\b/gi, 'and').replace(/\s+/g, ' ').trim();
  return p || 'a traditional combination of local ingredients';
}

function definition(word) {
  const p = cleanPhrase(word);
  const i = ingredientText(word);
  if (/^baguette sandwich$/i.test(p)) return 'A Vietnamese baguette filled with meat, pickled vegetables, and fresh herbs.';
  if (/^roast duck$/i.test(p)) return 'A Vietnamese dish of duck roasted until the skin is crisp and the meat is tender.';
  if (/^bun bo nam bo$/i.test(p)) return 'A southern Vietnamese beef noodle dish served with herbs, vegetables, and sauce.';
  if (/balut/i.test(p)) return 'A boiled fertilized duck egg eaten as a Vietnamese street-food snack.';
  if (/\bsteak$/i.test(p)) return `A Vietnamese sizzling beef dish served hot from the pan.`;
  if (/\bcurry$/i.test(p)) return `A Vietnamese curry made with ${i}.`;
  if (/\bwaffle$/i.test(p)) return `A Vietnamese waffle flavoured with ${i}.`;
  if (/\bdoughnuts?$/i.test(p)) return `A Vietnamese doughnut filled or coated with ${i}.`;
  if (/\bdough sticks$/i.test(p)) return 'A Vietnamese fried dough snack served with drinks or noodles.';
  if (/\bballs?$/i.test(p)) return `Small Vietnamese fried or boiled balls made with ${i}.`;
  if (/\beggs?$/i.test(p)) return `A Vietnamese egg dish prepared with ${i}.`;
  if (/\bpotatoes?$/i.test(p)) return `A Vietnamese snack made with grilled or sweet potatoes.`;
  if (/\bcorn$/i.test(p)) return 'A Vietnamese snack made by grilling corn until lightly charred.';
  if (/\bcornmeal$/i.test(p)) return 'A Vietnamese dish made by steaming seasoned cornmeal.';
  if (/\bvermicelli$/i.test(p)) return `A Vietnamese vermicelli dish prepared with ${i}.`;
  if (/\bskewers?$/i.test(p)) return `Vietnamese skewers made with ${i}.`;
  if (/\bpaste$/i.test(p)) return `A Vietnamese paste made from ${i}.`;
  if (/\bpizza$/i.test(p)) return `A Vietnamese rice-paper snack topped with ${i}.`;
  if (/\bmeat$/i.test(p)) return `A Vietnamese meat specialty prepared by smoking ${i}.`;
  if (/\bbuns?$/i.test(p)) return `A Vietnamese steamed bun filled with ${i}.`;
  if (/\bjelly$/i.test(p)) return `A Vietnamese jelly dessert made with ${i}.`;
  if (/\bpickles?$|pickled\b/i.test(p)) return `A Vietnamese side dish made by pickling ${i}.`;
  if (/\bveal$/i.test(p)) return 'A Vietnamese specialty of veal roasted over charcoal until tender.';
  if (/\bsheets?$/i.test(p)) return `Thin Vietnamese rice sheets made by steaming ${i}.`;
  if (/\band\b/i.test(p)) return `A Vietnamese dish combining ${p.replace(/\s+and\s+/i, ' and ')}.`;
  if (/\bin\b/i.test(p)) {
    const [left, ...rest] = p.split(/\s+in\s+/i);
    return `A Vietnamese dish of ${left} prepared in ${rest.join(' in ')}.`;
  }
  if (/porridge$|congee$/i.test(p)) return `A Vietnamese porridge made with ${i}.`;
  if (/^pork aspic$/i.test(p)) return 'A savoury Vietnamese jelly made from pork and a set meat broth.';
  if (/^head cheese$/i.test(p)) return 'A Vietnamese cold cut made from seasoned pork parts set into a firm loaf.';
  if (/pho$/i.test(p) || /pho\b/i.test(p)) return `A Vietnamese noodle soup made with ${p.replace(/\bpho\b/gi, '').trim() || 'a fragrant broth'}.`;
  if (/noodle soup$/i.test(p)) return `A Vietnamese noodle soup featuring ${i}.`;
  if (/soup$/i.test(p)) return `A Vietnamese soup featuring ${i}.`;
  if (/hotpot$/i.test(p)) return `A Vietnamese hotpot featuring ${i}.`;
  if (/sweet soup$/i.test(p)) return `A Vietnamese sweet soup made with ${i}.`;
  if (/dessert$/i.test(p)) return `A Vietnamese dessert made with ${i}.`;
  if (/salad$/i.test(p)) return `A Vietnamese salad made with ${i}.`;
  if (/spring rolls?$/i.test(p)) return `Vietnamese rolls filled with ${i}.`;
  if (/rolls?$/i.test(p)) return `Vietnamese rolls prepared with ${i}.`;
  if (/pancakes?$/i.test(p)) return `A Vietnamese pancake made with ${i}.`;
  if (/dumplings?$/i.test(p)) return `A Vietnamese dumpling made with ${i}.`;
  if (/cakes?$/i.test(p)) return `A Vietnamese cake made with ${i}.`;
  if (/pastry$/i.test(p)) return `A Vietnamese pastry filled or topped with ${i}.`;
  if (/fritters?$/i.test(p)) return `A Vietnamese fritter made with ${i}.`;
  if (/sausage$/i.test(p)) return `A Vietnamese sausage made from ${i}.`;
  if (/stew$/i.test(p)) return `A Vietnamese stew made with ${i}.`;
  if (/candy$/i.test(p)) return `A Vietnamese sweet made with ${i}.`;
  if (/cookies?$/i.test(p)) return `A Vietnamese cookie made with ${i}.`;
  if (/omelette$/i.test(p)) return `A Vietnamese omelette made with ${i}.`;
  if (/pudding$/i.test(p)) return `A Vietnamese pudding made with ${i}.`;
  if (/yogurt$/i.test(p)) return `A Vietnamese yogurt dessert made with ${i}.`;
  if (/ice cream$/i.test(p)) return `A Vietnamese ice cream dessert made with ${i}.`;
  if (/custard$/i.test(p)) return `A Vietnamese baked custard dessert made with ${i}.`;
  if (/sticky rice$/i.test(p)) return `A Vietnamese sticky-rice dish made with ${i}.`;
  if (/rice$/i.test(p)) return `A Vietnamese rice dish featuring ${i}.`;
  if (/fish$/i.test(p)) return `A Vietnamese fish dish prepared with ${i}.`;
  if (/chicken$/i.test(p)) return `A Vietnamese chicken dish prepared with ${i}.`;
  if (/banana$/i.test(p)) return `A Vietnamese banana-based snack or dessert prepared with ${i}.`;
  if (/\bwith\b/i.test(p)) {
    const [left, ...rest] = p.split(/\s+with\s+/i);
    return `A Vietnamese dish of ${left} served with ${rest.join(' with ')}.`;
  }
  if (/\bwrapped in\b/i.test(p)) {
    const [left, right] = p.split(/\s+wrapped in\s+/i);
    return `A Vietnamese dish in which ${left} is enclosed by ${right}.`;
  }
  return `A traditional Vietnamese dish prepared as a savoury or sweet specialty.`;
}

const specificDefinitions = {
  'quang noodles': 'A regional Vietnamese noodle dish served with a small amount of rich broth and toppings.',
  'hoi an noodles': 'A regional Vietnamese noodle dish associated with the city of Hoi An.',
  'sweet popiah': 'A Vietnamese sweet roll filled with coconut, sugar, and other dessert ingredients.',
  'caramelized fish sauce dip': 'A sweet-salty Vietnamese dipping sauce made by caramelizing fish sauce.',
  'tapioca dumplings with shrimp and pork': 'Starchy Vietnamese dumplings served with shrimp and pork.',
  'lemongrass pork skewers': 'Grilled skewers flavoured with lemongrass and made with pork.',
  'caramelized pork and eggs': 'A Vietnamese dish of pork and eggs simmered in a sweet, savoury sauce.',
  'mung bean, durian, and salted egg pastry': 'A Vietnamese pastry filled with mung bean, durian, and salted egg.',
  'smoked buffalo meat': 'Buffalo meat preserved by smoking.',
  'mung bean, shrimp, and pork fritters': 'Vietnamese fritters made with mung beans, shrimp, and pork.',
  'crispy fried elephant ear fish': 'A whole elephant-ear fish fried until its skin is crisp.',
  'sesame doughnuts': 'Fried Vietnamese doughnuts coated with sesame seeds.',
  'mooncake': 'A round filled pastry traditionally eaten during the Mid-Autumn Festival.',
  'pandan waffle': 'A waffle flavoured with aromatic pandan leaves.',
  'fried fish balls': 'Small fish balls that are cooked in hot oil.',
  'fried beef balls': 'Small beef balls that are cooked in hot oil.',
  'grilled quail eggs': 'Quail eggs cooked on a grill until set.',
  'pickled onions': 'Onions preserved in a sharp, vinegary mixture.',
  'coconut jelly': 'A jelly dessert made from coconut milk or coconut water.'
};

function finalDefinition(word) {
  const d = isVegetableList ? vegetableDefinition(word) : (specificDefinitions[word] || definition(word));
  return d.toLowerCase().includes(word.toLowerCase())
    ? (isVegetableList ? 'An edible plant used in Vietnamese cooking.' : 'A traditional Vietnamese specialty from the country’s regional cuisine.')
    : d;
}

function ipaFor(word, accent) {
  if (isVegetableList) {
    const voice = accent === 0 ? 'en-gb' : 'en-us';
    const spoken = spawnSync('espeak', ['--ipa', '-q', '-v', voice, word], { encoding: 'utf8' }).stdout.trim();
    if (spoken) return `/${spoken.replace(/\s+/g, ' ')}/`;
  }
  const tokens = word.toLowerCase().split(/\s+/).map(t => t.replace(/[(),]/g, ''));
  const parts = tokens.map(t => (ipa[t]?.[accent] || `ˈ${t.replace(/-/g, ' ')}`)
    .replace(/^\//, '').replace(/\/$/, ''));
  return `/${parts.join(' ')}/`;
}

function safe(s) { return String(s).replace(/[\t\r\n]+/g, ' ').trim(); }
function lower(s) { return s.toLowerCase(); }

const raw = fs.readFileSync(inputPath, 'utf8');
const rows = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
  const [left, ...right] = line.split('=');
  return { word: left.trim().toLowerCase(), meaning: right.join('=').split('#')[0].trim() };
});
const seen = new Set();
const items = rows.filter(x => !seen.has(x.word) && seen.add(x.word));

const leafyWords = /(?:leaves?|greens?|spinach|watercress|lettuce|fern|chives|celery|dill|pennywort|purslane|moringa|mustard|bok choy|cabbage|kale|choy sum|amaranth|katuk|malabar|jute|crown daisy|perilla|coriander|culantro|mint|basil|oregano|herb|water spinach|pepper elder|water mimosa|ramie|lotus leaves|betel|lolot)/i;
const rootWords = /(?:root|taro|radish|carrot|beetroot|kohlrabi|jicama|potato|cassava|yam|water caltrop|ginger|turmeric|galangal|lemongrass|shallot|garlic|onion|chestnut|lotus root|bamboo shoots)/i;
const fruitWords = /(?:banana|papaya|jackfruit|mango|pomelo|orange|mandarin|lime|kumquat|watermelon|pineapple|dragon fruit|durian|mangosteen|rambutan|longan|lychee|star apple|guava|rose apple|sapodilla|sugar apple|soursop|avocado|passion fruit|tamarind|starfruit|ambarella|jujube|fig|pomegranate|grape|strawberry|mulberry|canistel|langsat|breadfruit|cashew apple|gac fruit|toddy palm fruit|plum|peach|persimmon|apricot|honeydew|cantaloupe|cocoa fruit|citron|tomato|cucumber|chayote|eggplant|pumpkin|okra|bean|peas|pepper|corn|asparagus|zucchini|bitter melon|sponge gourd|ridge gourd|winter melon|bottle gourd|coconut)/i;
const mushroomWords = /mushroom/i;
const flowerWords = /flowers?|blossom/i;

function vegetableDefinition(word) {
  return detailedVegetableDefinition(word);
}

function example(word) {
  return isVegetableList
    ? `I added ${word} to a Vietnamese meal for extra flavour.`
    : `I ordered ${word} at a Vietnamese restaurant because I wanted to try something new.`;
}
function exampleVie(meaning) {
  return isVegetableList
    ? `Tôi đã thêm ${meaning.toLowerCase()} vào một món ăn Việt Nam để món ăn đậm đà hơn.`
    : `Tôi đã gọi món ${meaning.toLowerCase()} tại một nhà hàng Việt Nam vì muốn thử món mới.`;
}
function viet(meaning) { return isVegetableList ? `${meaning}.` : `Món ${meaning}.`; }

const choice = [];
const fill = [];
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const def = finalDefinition(item.word);
  const ex = example(item.word);
  const exVie = exampleVie(item.meaning);
  const options = [items[(i + 1) % items.length].word, items[(i + 2) % items.length].word, items[(i + 3) % items.length].word];
  const pos = i % 4;
  options.splice(pos, 0, item.word);
  const answerLetter = 'abcd'[pos];
  const common = [item.word, isVegetableList ? 'noun' : 'phrase', ipaFor(item.word, 0), ipaFor(item.word, 1), isVegetableList ? 'B1' : 'B2', def, viet(item.meaning), '', ex, exVie, '', ''];
  choice.push([`${i + 1}-${idStem}`, def, ...options, answerLetter, ...common].map(safe).join('\t'));
  const blank = item.word.split(/\s+/).map(() => '__').join(' ');
  const fillQuestion = isVegetableList
    ? `I added ${blank} to a Vietnamese meal for extra flavour.`
    : `I ordered ${blank} at a Vietnamese restaurant because I wanted to try something new.`;
  fill.push([`${items.length + i + 1}-${idStem}`, fillQuestion, item.word, isVegetableList ? 'noun' : 'phrase', ipaFor(item.word, 0), ipaFor(item.word, 1), isVegetableList ? 'B1' : 'B2', def, viet(item.meaning), '', ex, exVie, '', ''].map(safe).join('\t'));
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `CHOICE-${outputStem}.txt`), choice.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(outDir, `FILL-${outputStem}.txt`), fill.join('\n') + '\n', 'utf8');
console.log(`Generated ${choice.length} choice rows and ${fill.length} fill rows for ${outputStem} (${idStem}).`);
