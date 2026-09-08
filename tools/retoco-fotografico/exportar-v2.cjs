const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const work = path.join(root, 'output/retoco-almoco-executivo-v2/conferencia');
const out = path.join(root, 'output/almoco-executivo-final');
const names = ['carne de sol', 'file mignon', 'peito de frango', 'peixe empanado', 'peixe grelhado', 'picanha suina', 'picanha'];
const hash = b => crypto.createHash('sha256').update(b).digest('hex');

async function main() {
  // Check completeness before creating the delivery folder.
  for (const name of names) await fs.access(path.join(work, name + '-gerada.png'));
  await fs.mkdir(out, { recursive: true });
  const inventory = [];
  for (const name of names) {
    const input = path.join(work, name + '-gerada.png');
    const original = path.join(root, 'site/almoco-executivo', name + '.webp');
    const before = await fs.readFile(original);
    const info = await sharp(input).metadata();
    // All generated frames have the same intended ratio; at most 1–2 edge pixels
    // differ in the picanha result. Normalize the delivery dimensions uniformly.
    await sharp(input).resize(1422, 1106, { fit: 'fill' }).withIccProfile('srgb')
      .webp({ lossless: true, effort: 6 }).toFile(path.join(out, name + '.webp'));
    const after = await fs.readFile(original);
    if (hash(before) !== hash(after)) throw new Error('Fonte alterada: ' + name);
    const delivered = await fs.readFile(path.join(out, name + '.webp'));
    const meta = await sharp(delivered).metadata();
    if (meta.width !== 1422 || meta.height !== 1106) throw new Error('Dimensões inesperadas');
    inventory.push({
      name: name + '.webp', sourceSha256: hash(before), generatedDimensions: [info.width, info.height],
      deliveredDimensions: [meta.width, meta.height], deliveredSha256: hash(delivered), bytes: delivered.length
    });
  }
  await fs.writeFile(path.join(work, 'entrega-v2.json'), JSON.stringify({
    method: 'Builtin image_gen edit with user-authorized reconstruction of focus/detail and table background.',
    visualChecks: 'Same identifiable meal, apparent portions and arrangement; full service and handles, consistent landscape frames. Fine textures and microtext are generative approximations, not recovered original pixels.',
    comparisonDeliverables: false,
    inventory
  }, null, 2) + '\n');
  console.log(JSON.stringify(inventory.map(({name,deliveredDimensions,bytes}) => ({name,deliveredDimensions,bytes})), null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
