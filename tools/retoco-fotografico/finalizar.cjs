const sharp=require('sharp');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const dest=path.join(root,'output/retoco-almoco-executivo-2026-09-07');
const source=path.join(root,'site/almoco-executivo');
const aux=path.join(dest,'conferencia');
const boxes={
  'carne de sol.webp':[240,270,260,190],
  'file mignon.webp':[218,266,260,190],
  'peito de frango.webp':[192,201,260,190],
  'peixe empanado.webp':[143,344,260,190],
  'peixe grelhado.webp':[99,294,260,190],
  'picanha suina.webp':[225,109,260,190],
  'picanha.webp':[490,246,260,190]
};
function banner(text,w,h,size=20) {
  return Buffer.from(`<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="#f4f1eb"/><text x="18" y="${h*.67}" font-family="Arial" font-size="${size}" fill="#243a32">${text}</text></svg>`);
}
async function stack(files,out,title) {
  const images=await Promise.all(files.map(f=>sharp(f).metadata()));
  const width=Math.max(...images.map(i=>i.width));
  let top=55;
  const inputs=[{input:banner(title,width,55),left:0,top:0}];
  for(let i=0;i<files.length;i++) {
    inputs.push({input:await fs.readFile(files[i]),left:0,top});
    top+=images[i].height+16;
  }
  await sharp({create:{width,height:top,channels:3,background:'#f4f1eb'}}).composite(inputs).jpeg({quality:94,chromaSubsampling:'4:4:4'}).toFile(out);
}
async function main() {
  const names=Object.keys(boxes);
  const mobile=names.map(n=>path.join(aux,n.replace('.webp','-celular.png')));
  await stack(mobile,path.join(dest,'antes-depois.jpg'),'Sir Fisher | Comparação das sete fotografias');
  await stack(mobile.slice(0,4),path.join(aux,'celular-serie-1.jpg'),'Conferência | 360 pixels por fotografia');
  await stack(mobile.slice(4),path.join(aux,'celular-serie-2.jpg'),'Conferência | 360 pixels por fotografia');
  for(const n of names) {
    const [left,top,width,height]=boxes[n];
    const inputs=await Promise.all([path.join(source,n),path.join(dest,n)].map(p=>sharp(p).extract({left,top,width,height}).resize(width*2,height*2,{kernel:'nearest'}).png().toBuffer()));
    await sharp({create:{width:1058,height:430,channels:3,background:'#f4f1eb'}}).composite([
      {input:banner(n.replace('.webp','')+' | 200%: antes / depois',1058,50),left:0,top:0},
      {input:inputs[0],left:0,top:50},{input:inputs[1],left:538,top:50}
    ]).png().toFile(path.join(aux,n.replace('.webp','-detalhe-200.png')));
  }
  const outputs=await Promise.all(names.map(async n=>({name:n,...await sharp(path.join(dest,n)).metadata(),bytes:(await fs.stat(path.join(dest,n))).size})));
  const table=outputs.map(i=>`| ${i.name} | ${i.width} × ${i.height} px | ${Math.round(i.bytes/1024)} KB |`).join('\n');
  const report=`# Sir Fisher — fotografias do almoço executivo

Sete cópias tratadas, com os nomes originais, em WebP sem perda adicional de compressão e perfil sRGB. As fontes permanecem intactas na pasta original.

## Ajustes

- Balanço de branco individual: redução do excesso de amarelo nas cinco fontes mais suaves; correção discreta do frio no papel da picanha suína.
- Redução moderada do aspecto esbranquiçado, contraste local contido e proteção gradual dos realces do arroz, papel e metal.
- Definição leve da textura existente e ajuste discreto de luminosidade sobre a proteína. As picanhas receberam tratamento menor por terem mais detalhe na origem.
- Retoque calculado a partir dos pixels originais, sem geração de conteúdo. Montagem, porções, molhos, temperos, recipientes, tábua, papel, textos e reflexos mantidos.
- Enquadramento, proporção e resolução originais preservados integralmente, incluindo a picanha suína horizontal. Sem ampliação das sete imagens entregues.

## Limitações

Carne de sol, filé mignon, peito de frango, peixe empanado e peixe grelhado já apresentam desfoque e névoa, especialmente nas bordas. A melhora é de leitura tonal; o tratamento não recupera detalhes ausentes. O filé mignon permanece o mais suave. Letras ilegíveis continuam sem reconstrução, e reflexos já sem informação na fonte não ganham detalhe real.

Para uso grande ou impressão, recomenda-se nova captura dessas cinco fotos, principalmente do filé mignon, com lente limpa, foco confirmado sobre o prato, apoio estável e luz suave. A diferença de definição para as picanhas foi respeitada.

## Diferenças observadas no cardápio

Na foto da picanha suína, o copinho contém granulado; não aparece molho barbecue, mencionado no cardápio local. Na picanha, o copinho contém um molho escuro, enquanto a descrição menciona molho de alho. A fotografia não permite confirmar a receita do molho nem a composição exata do granulado; ambos foram preservados. O peixe grelhado não recebeu marcas de grelha novas.

## Arquivos

| Imagem | Resolução mantida | Tamanho aproximado |
|---|---:|---:|
${table}

**antes-depois.jpg** reúne as sete comparações, com o original à esquerda e o tratamento à direita. A pasta **conferencia** contém pares maiores, provas a 360 px e detalhes ampliados apenas para inspeção. A ampliação das provas não representa ganho de resolução nas entregas.

## Conferência

Prova inicial feita no filé mignon antes de tratar a série. Conferência visual lado a lado, em tamanho de celular e com ampliação de detalhe, incluindo revisão independente. Originais identificados por SHA-256 em **conferencia/originais.json**; parâmetros registrados em **conferencia/parametros.json**. O script reproduzível está em **../../tools/retoco-fotografico/retocar.cjs**. A validação técnica confirmou os sete originais intactos, dimensões iguais, registro sem deslocamento e ausência de novos canais saturados em 0 ou 255; relatório em **conferencia/validacao-tecnica.json**.
`;
  await fs.writeFile(path.join(dest,'RESUMO.md'),report);
  console.log(JSON.stringify(outputs.map(({name,width,height,bytes})=>({name,width,height,bytes})),null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
