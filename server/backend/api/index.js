import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

export default async function() {
    return (await Promise.all((await fs.readdir(path.dirname(url.fileURLToPath(import.meta.url)), {withFileTypes: true, recursive: true}))
        .filter(f => !f.isDirectory()).map(f => import(url.pathToFileURL(path.join(f.parentPath, f.name))))))
        .map(m => m.default);
}