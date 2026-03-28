import minimist from 'minimist';
import fs from 'fs';
import utils from 'utils';
import { patch } from './index.js';

let argv = minimist(process.argv.slice(2));

let port = 3000;
if (argv.port) {
    try {
        port = parseInt(argv.port);
        if (isNaN(port) || port > 65535) {
            throw "";
        }
    } catch (err) {
        utils.logger.warn('Invalid port specified, defaulting to 3000');
        port = 3000;
    }
}

if (!argv.path || argv.path === true) {
    utils.logger.error('Executable not specified (--path "/path/to/WorldOfGoo.exe")');
    process.exit(1);
}

if (fs.existsSync(argv.path + ".backup")) {
    fs.rmSync(argv.path, {force: true})
    fs.renameSync(argv.path + '.backup', argv.path)
}

let file;
try {
    file = fs.readFileSync(argv.path);
} catch (err) {
    utils.logger.error('Unable to read file: ' + argv.path);
    process.exit(1);
}

try {
    fs.writeFileSync(argv.path + '.backup', file);
} catch (err) {
    if (argv.force) {
        utils.logger.warn('Unable to write backup file, continuing anyway');
    } else {
        utils.logger.error('Unable to write backup file\nIf you still want to continue, use --force');
        process.exit(1);
    }
}

let outputFile = patch(file, port, !!argv.force);

try {
    fs.writeFileSync(argv.path, outputFile);
} catch (err) {
    utils.logger.error('Unable to write file: ' + argv.path);
    process.exit(1);
}

utils.logger.info('Patched successfully');