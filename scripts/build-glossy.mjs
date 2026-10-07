import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function buildGlossy(directory=path.join(root,'demo/generated')) {
 await mkdir(directory,{recursive:true});
 await build({entryPoints:[path.join(root,'demo/avatar-studio-glossy.js')],outfile:path.join(directory,'glossy.js'),bundle:true,format:'esm',minify:true,target:'es2022',legalComments:'eof'});
 await copyFile(path.join(root,'node_modules/three/LICENSE'),path.join(directory,'THREE-LICENSE.txt'));
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildGlossy();
