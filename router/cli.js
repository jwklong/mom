import minimist from 'minimist';
import utils from 'utils';
import { router } from './index.js';

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

if (!argv.host || argv.host === true) {
    utils.logger.error('Host not specified (--host "http://example.com:3000")');
    process.exit(1);
}

router(port, argv.host);