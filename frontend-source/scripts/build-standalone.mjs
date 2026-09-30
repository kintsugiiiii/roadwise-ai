import { readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { build } from 'vite';

const root = process.cwd();
async function buildStandalone(entryName, outputName, title) {
  const entryBase = entryName.replace(/\.html$/, '');
  const standaloneDist = join(root, `.standalone-${entryBase}`);
  await build({
    configFile: join(root, 'vite.config.ts'),
    build: {
      outDir: standaloneDist,
      emptyOutDir: true,
      rollupOptions: {
        input: join(root, entryName),
        output: { inlineDynamicImports: true },
      },
    },
  });

  const document = await readFile(join(standaloneDist, entryName), 'utf8');
  const scriptNames = [...document.matchAll(/src="\.\/assets\/([^\"]+\.js)"/g)].map((match) => match[1]);
  const styleNames = [...document.matchAll(/href="\.\/assets\/([^\"]+\.css)"/g)].map((match) => match[1]);
  if (!scriptNames.length || !styleNames.length) throw new Error(`Could not find build assets for ${entryName}.`);

  let script = (await Promise.all(scriptNames.map((name) => readFile(join(standaloneDist, 'assets', name), 'utf8')))).join('\n');
  const css = (await Promise.all(styleNames.map((name) => readFile(join(standaloneDist, 'assets', name), 'utf8')))).join('\n');
  const assets = [...new Set([...script.matchAll(/new URL\("([^\"]+\.(?:png|jpe?g|gif|webp))",import\.meta\.url\)/g)].map((match) => match[1]))];

  for (const name of assets) {
    const extension = extname(name).toLowerCase();
    const mime = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
    const data = `data:${mime};base64,${(await readFile(join(standaloneDist, 'assets', name))).toString('base64')}`;
    script = script.replaceAll(`new URL("${name}",import.meta.url).href`, JSON.stringify(data));
  }

  const target = join(root, outputName);
  await writeFile(target, `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title><style>${css}</style></head><body><div id="root"></div><script type="module">${script}</script></body></html>`, 'utf8');
  await rm(standaloneDist, { recursive: true, force: true });
  console.log(`Created ${target} with ${assets.length} embedded images.`);
}

await buildStandalone('index.html', 'RoadwiseLab智能工作台完整.html', 'RoadwiseLab 智能工作台 - 项目负责人版');
await buildStandalone('workbench.html', 'RoadwiseLab独立工作台.html', 'RoadwiseLab - 全局项目工作台');
