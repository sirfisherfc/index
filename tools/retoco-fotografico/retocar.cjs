const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'site/almoco-executivo');
const dest = path.join(root, 'output/retoco-almoco-executivo-2026-09-07');
const aux = path.join(dest, 'conferencia');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const configs = {
  'carne de sol.webp': {wb:[0.985,1,1.052],black:0.035,contrast:0.13,ev:0.015,sat:0.985,clarity:0.14,sharp:0.24,lift:0.008,protein:[[.35,.39],[.54,.34],[.65,.52],[.54,.68],[.35,.61]],paper:[585,175,28,145]},
  'file mignon.webp': {wb:[0.994,1,1.042],black:0.043,contrast:0.17,ev:0.035,sat:0.99,clarity:0.16,sharp:0.24,lift:0.016,protein:[[.31,.38],[.46,.34],[.56,.50],[.59,.67],[.50,.78],[.27,.80],[.27,.57]],paper:[565,205,25,135]},
  'peito de frango.webp': {wb:[0.989,1,1.025],black:0.032,contrast:0.15,ev:0.015,sat:0.985,clarity:0.13,sharp:0.22,lift:0.004,protein:[[.26,.30],[.43,.28],[.54,.42],[.55,.54],[.46,.55],[.28,.47]],paper:[515,180,26,190]},
  'peixe empanado.webp': {wb:[0.990,1,1.025],black:0.032,contrast:0.15,ev:0.025,sat:0.985,clarity:0.14,sharp:0.23,lift:0.007,protein:[[.20,.56],[.41,.44],[.50,.45],[.53,.60],[.52,.71],[.23,.77]],paper:[570,135,28,198]},
  'peixe grelhado.webp': {wb:[0.990,1,1.028],black:0.023,contrast:0.13,ev:0.035,sat:0.987,clarity:0.12,sharp:0.23,lift:0.005,protein:[[.13,.40],[.29,.36],[.36,.43],[.46,.56],[.42,.67],[.31,.70],[.22,.64],[.24,.54],[.12,.52]],paper:[557,175,28,195]},
  'picanha suina.webp': {wb:[1.015,1,0.975],black:0.004,contrast:0.045,ev:0.020,sat:0.99,clarity:0.065,sharp:0.10,lift:0.009,protein:[[.31,.19],[.42,.18],[.50,.42],[.46,.55],[.46,.72],[.40,.77],[.33,.65],[.27,.62],[.28,.35]],paper:[670,24,25,45]},
  'picanha.webp': {wb:[0.997,1,1.008],black:0.004,contrast:0.055,ev:0.005,sat:1,clarity:0.075,sharp:0.10,lift:0.022,protein:[[.35,.16],[.43,.15],[.59,.30],[.62,.36],[.67,.43],[.68,.55],[.64,.60],[.55,.53],[.48,.49],[.33,.38],[.28,.30]],paper:[1050,68,80,45]}
};
const observations = {
  'carne de sol.webp':'Pedaços de carne no centro com cebola roxa e verdes; arroz no alto; granulado à direita; bastões grossos à esquerda; tomate e folhas embaixo; copinho com conteúdo escuro à direita. Névoa, dominante quente e desfoque periférico; preservar sobreposições e número aparente de pedaços.',
  'file mignon.webp':'Carne castanha central com ervas e verdes; arroz no alto à esquerda; fritas no alto à direita; granulado à esquerda; tomate e folhas parcialmente cobertos; copinho de creme alaranjado à direita. Fonte mais suave: sem detalhe fino recuperável nas bordas da carne, copinho e letras desfocadas.',
  'peito de frango.webp':'Peça clara e dourada no centro superior com temperos; bastões grossos à esquerda; arroz com verdes embaixo; granulado ao centro/direita; tomate, folhas e tiras claras; copinho bege à direita. Véu claro e desfoque; não criar crosta nem grelha.',
  'peixe empanado.webp':'Duas formas alongadas com cobertura granulada dourada no centro inferior; arroz com verdes no alto à esquerda; fritas no alto; granulado com pedaços amarelos à esquerda; salada à direita; copinho alaranjado. Desfoque periférico; preservar cada borda e textura já registrada.',
  'peixe grelhado.webp':'Duas porções claras e douradas à esquerda/centro; fritas no alto; arroz com verdes à direita; granulado embaixo; tomate e folhas parcialmente cobertos; copinho claro com pontos coloridos. Névoa e desfoque. Não há marcas de grelha claramente reconhecíveis; o nome não autoriza acrescentá-las. Área externa à mesa no alto preservada.',
  'picanha suina.webp':'Peça maior com marcas lineares e peça menor abaixo à esquerda; verdes picados; tomate e folhas; fritas no alto; arroz com verdes à direita/embaixo; copinho de granulado no alto à esquerda. Fonte mais nítida e horizontal; preservar alças laterais e quadro completo.',
  'picanha.webp':'Carne escura sobre tomate, cebola roxa e folhas, com temperos secos ao centro; arroz embaixo à esquerda; granulado acima; fritas embaixo à direita; copinho com conteúdo escuro no alto à direita. Boa definição; levantar discretamente a luminosidade da carne sem mudar seu ponto ou cor.'
};

async function raw(file) {
  return sharp(file).toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});
}
async function prepare() {
  await fs.mkdir(aux,{recursive:true});
  const inventory=[];
  for(const [name,c] of Object.entries(configs)) {
    const file=path.join(source,name), bytes=await fs.readFile(file);
    const {data,info}=await raw(file);
    const [x,y,w,h]=c.paper;
    const sum=[0,0,0]; let count=0;
    for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++) {
      const k=(j*info.width+i)*3, r=data[k],g=data[k+1],b=data[k+2];
      if(Math.min(r,g,b)>160&&Math.max(r,g,b)-Math.min(r,g,b)<45) {
        sum[0]+=r;sum[1]+=g;sum[2]+=b;count++;
      }
    }
    inventory.push({name,width:info.width,height:info.height,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),paperMean:sum.map(v=>+(v/count).toFixed(2)),observations:observations[name]});
  }
  await fs.writeFile(path.join(aux,'originais.json'),JSON.stringify(inventory,null,2)+'\n');
  await fs.writeFile(path.join(aux,'inspecao-inicial.md'), '# Inspeção anterior ao retoque\n\nTodos os arquivos foram examinados visualmente. Preservar alimentos, quantidades aparentes, sobreposições, ponto, ervas, reflexos, recipiente metálico, duas alças, copinho, tábua, papel, marca e letras existentes. Não reconstruir nada. Manter dimensões e enquadramento integral.\n\n'+inventory.map(i=>`- **${i.name} — ${i.width} × ${i.height} px:** ${i.observations}`).join('\n\n')+'\n\nPadrão: luz natural ligeiramente quente, papel/metal neutros sem azul, brancos detalhados, sombras legíveis, contraste moderado, cor contida. As cinco fontes suaves receberão um pouco mais de redução de véu; as picanhas, ajustes menores. Não igualar a nitidez inventando textura.\n\nDivergências com o cardápio local: na picanha suína o copinho contém granulado e não há molho barbecue visível; na picanha o copinho tem conteúdo escuro, enquanto a descrição menciona molho de alho. A composição do granulado e o tipo exato de molho não podem ser confirmados pela imagem. As fotografias prevalecem.\n');
  console.log(JSON.stringify(inventory.map(({name,width,height,paperMean})=>({name,width,height,paperMean})),null,2));
}

function pointInPolygon(x,y,p) {
  let hit=false;
  for(let i=0,j=p.length-1;i<p.length;j=i++) {
    const [xi,yi]=p[i], [xj,yj]=p[j];
    if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) hit=!hit;
  }
  return hit;
}
async function blurGrey(data,width,height,sigma) {
  return sharp(data,{raw:{width,height,channels:1}}).blur(sigma).greyscale().raw().toBuffer();
}
async function retouch(name, overrides={}, suffix='') {
  const c={...configs[name],...overrides};
  const {data,info:{width,height}}=await raw(path.join(source,name));
  const size=width*height, rgb=new Float32Array(size*3), lum=new Float32Array(size);
  const grey=Buffer.alloc(size), mask=Buffer.alloc(size);
  const exposure=Math.pow(2,c.ev);
  for(let i=0;i<size;i++) {
    let r=data[i*3]/255*c.wb[0],g=data[i*3+1]/255*c.wb[1],b=data[i*3+2]/255*c.wb[2];
    const y=.2126*r+.7152*g+.0722*b;
    // Shadow correction fades out smoothly toward white, preserving highlights.
    let t=y-c.black*Math.sin(Math.PI*clamp(y));
    t+=c.contrast*t*(1-t)*(2*t-1);
    t=clamp(t*exposure);
    const gain=y>1e-5?t/y:1;
    for(let ch=0;ch<3;ch++)rgb[i*3+ch]=t+(([r,g,b][ch]*gain)-t)*c.sat;
    // Smooth highlight shoulder, with common RGB gain to retain colour ratios.
    const peak=Math.max(rgb[i*3],rgb[i*3+1],rgb[i*3+2]);
    if(peak>.94) {
      const safePeak=.94+.06*(1-Math.exp(-(peak-.94)/.06));
      const shoulder=safePeak/peak;
      for(let ch=0;ch<3;ch++)rgb[i*3+ch]*=shoulder;
      t*=shoulder;
    }
    lum[i]=t; grey[i]=Math.round(clamp(t)*255);
    const x=(i%width)/width, py=Math.floor(i/width)/height;
    mask[i]=pointInPolygon(x,py,c.protein)?255:0;
  }
  const sigma=Math.min(width,height)/62;
  const wide=await blurGrey(grey,width,height,sigma);
  const fine=await blurGrey(grey,width,height,.65);
  const softMask=await blurGrey(mask,width,height,Math.min(width,height)/48);
  const out=Buffer.alloc(size*3);
  for(let i=0;i<size;i++) {
    const y=lum[i], m=softMask[i]/255;
    const midWeight=Math.min(1,y/.10,(1-y)/.12);
    const texture=clamp(y-wide[i]/255,-.10,.10)*(c.clarity+m*.055);
    const detail=clamp(y-fine[i]/255,-.025,.025)*c.sharp;
    const dodge=c.lift*m*Math.sin(Math.PI*clamp(y));
    let delta=(texture+detail+dodge)*midWeight;
    // Retain at least one code value of headroom for each unclipped source channel.
    let lower=-1,upper=1;
    for(let ch=0;ch<3;ch++) {
      const original=data[i*3+ch];
      lower=Math.max(lower,(original===0?0:1/255)-rgb[i*3+ch]);
      upper=Math.min(upper,(original===255?1:254/255)-rgb[i*3+ch]);
    }
    delta=clamp(delta,lower,upper);
    for(let ch=0;ch<3;ch++)out[i*3+ch]=Math.round(clamp(rgb[i*3+ch]+delta)*255);
  }
  const output=path.join(suffix?aux:dest, suffix?name.replace('.webp',`-${suffix}.webp`):name);
  await sharp(out,{raw:{width,height,channels:3}}).withIccProfile('srgb').webp({lossless:true,effort:6}).toFile(output);
  console.log(output);
  return {name,config:c,output,width,height};
}
function svgText(text,w,h,size=23) {
  const safe=text.replaceAll('&','&amp;').replaceAll('<','&lt;');
  return Buffer.from(`<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="#f4f1eb"/><text x="18" y="${h*.67}" font-family="Arial" font-size="${size}" fill="#243a32">${safe}</text></svg>`);
}
async function comparison(name,afterFile,outFile,tileWidth=760) {
  const meta=await sharp(path.join(source,name)).metadata();
  const w=Math.min(tileWidth,meta.width), h=Math.round(w*meta.height/meta.width), gap=18, title=45, label=34;
  const panels=await Promise.all([path.join(source,name),afterFile].map(file=>sharp(file).resize(w,h,{fit:'fill'}).png().toBuffer()));
  await sharp({create:{width:w*2+gap,height:h+title+label,channels:3,background:'#f4f1eb'}}).composite([
    {input:svgText(name.replace('.webp',''),w*2+gap,title),left:0,top:0},
    {input:svgText('ANTES',w,label,16),left:0,top:title},
    {input:svgText('DEPOIS',w,label,16),left:w+gap,top:title},
    {input:panels[0],left:0,top:title+label},{input:panels[1],left:w+gap,top:title+label}
  ]).png().toFile(outFile);
}
async function main() {
  const mode=process.argv[2]||'prepare';
  if(mode==='prepare')return prepare();
  if(mode==='proof') {
    const proof=await retouch('file mignon.webp',{},'prova');
    await comparison('file mignon.webp',proof.output,path.join(aux,'file-mignon-prova-antes-depois.png'),761);
    return;
  }
  if(mode==='all') {
    const results=[];
    for(const name of Object.keys(configs)) {
      const result=await retouch(name);results.push(result);
      await comparison(name,result.output,path.join(aux,name.replace('.webp','-antes-depois.png')),760);
      await comparison(name,result.output,path.join(aux,name.replace('.webp','-celular.png')),360);
    }
    await fs.writeFile(path.join(aux,'parametros.json'),JSON.stringify(results,null,2)+'\n');
    return;
  }
  throw new Error('Modo desconhecido: '+mode);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
