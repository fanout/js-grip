import { promises as fs } from 'fs';
import path, { dirname } from 'path';
import url, { fileURLToPath } from 'url';

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const FILE_NAME = url.parse(import.meta.url).pathname;

if (FILE_NAME.endsWith('/index.mjs')) {
    test();
}

async function getTestFiles() {
    const files = await fs.readdir(TESTS_DIR);
    return files
        .map(filename => path.join(TESTS_DIR, filename))
        .filter(pathname => pathname !== FILE_NAME);
}

async function test() {
    const testFiles = await getTestFiles();
    await Promise.all(testFiles.map(async filepath => await import(filepath)));
}
