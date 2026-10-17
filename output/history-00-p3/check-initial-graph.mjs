import { build } from 'esbuild';
import { options } from '../../build.mjs';
import { writeFile } from 'node:fs/promises';
const result = await build({...options,write:false,metafile:true,logLevel:'silent'});
const outputs=result.metafile.outputs;
const visited=new Set();
function walk(path){if(visited.has(path))return;visited.add(path);for(const item of outputs[path]?.imports||[])if(item.kind!=='dynamic-import')walk(item.path);}
walk('dist/bootstrap.js');
const inputs=[...new Set([...visited].flatMap(path=>Object.keys(outputs[path]?.inputs||{})))];
if(inputs.some(path=>/node_modules\/three\/|src\/main\.js|src\/model\.js|src\/scene\.js/.test(path)))throw Error('Heavy input in initial graph');
await writeFile('output/history-00-p3/initial-bundle-graph.json',JSON.stringify({outputs:[...visited],inputs,dynamicImports:outputs['dist/bootstrap.js'].imports.filter(i=>i.kind==='dynamic-import')},null,2));
console.log('Initial static graph excludes Three/main/model/scene:',inputs.length,'inputs');
