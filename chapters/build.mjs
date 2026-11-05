import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function buildChapters(out='dist/chapters') {
  const dest=resolve(root,out);await mkdir(dest,{recursive:true});
  const mono=await readFile(resolve(root,'chapters/fonts/jetbrains-mono-latin-400-normal.woff2'));
  const inter=await readFile(resolve(root,'chapters/fonts/inter-latin-wght-normal.woff2'));
  const fonts=`@font-face{font-family:'JetBrains Mono';src:url(data:font/woff2;base64,${mono.toString('base64')})}@font-face{font-family:Inter;font-weight:100 900;src:url(data:font/woff2;base64,${inter.toString('base64')})}`;
  const notices=await readFile(resolve(root,'chapters/THIRD-PARTY-NOTICES.txt'),'utf8');
  for(const [name,entry,title] of [['01','atelier','Bombe · 机械的逻辑'],['02','bench/lab','信号实验室'],['03','bench/challenge','解密挑战']]){
    const source=entry==='atelier'?'atelier/main.js':`${entry}.js`;
    const res=await build({entryPoints:[resolve(root,'chapters',source)],absWorkingDir:root,bundle:true,write:false,minify:true,format:'esm',target:'es2022',legalComments:'none',alias:{three:'three-teardown','teardown-kit':resolve(root,'chapters/kit')}});
    const css=await readFile(resolve(root,`chapters/${entry==='atelier'?'atelier':'bench'}/style.css`),'utf8');
    const js=res.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
    const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · 译码档案</title><style>${fonts}\n${css}</style></head><body><div id="app"></div><script type="module">${js}</script><!-- ${notices.replace(/--/g,'—')} --></body></html>`;
    await writeFile(resolve(dest,`${name}.html`),html);console.log(`Chapter ${name}: ${Buffer.byteLength(html).toLocaleString()} bytes`);
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildChapters();
