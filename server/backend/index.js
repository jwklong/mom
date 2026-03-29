import express from 'express';
import utils from 'utils';
import minimist from 'minimist';
import path from 'node:path';
import url from 'node:url';
import cors from 'cors';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
let argv = minimist(process.argv.slice(2));
const randomHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

const db = new utils.db.Database();
await db.init(argv.dbPath || path.join(__dirname, '..', '..', 'database.json'));

let port = 3000;
if (argv.backendPort) {
    try {
        port = parseInt(argv.backendPort);
        if (isNaN(port) || port > 65535) {
            throw "";
        }
    } catch (err) {
        utils.logger.warn('Invalid port specified, defaulting to 3000');
        port = 3000;
    }
}

const app = express();

app.use(cors());
app.use(express.json());
import api from './api/index.js';
(await api()).forEach(route => route({ app, db }));

app.use(express.urlencoded({ extended: true }));

app.use('/', (req, res, next) => {
    if (!req.body || !req.body.op) {
        res.status(404).end();
        return;
    }

    utils.logger.info(`Received request (${req.body.op})`);

    switch (req.body.op) {
        case 'GetPlayerKey': {
            if (
                !req.body.hwkey || String(req.body.hwkey).length !== 32 ||
                !req.body.name || String(req.body.name).length == 0
            ) {
                res.status(400).end("Invalid parameters");
                break;
            }

            res.type('xml');
            res.end(`<WogResponse result="OK"><playerkey>${randomHex(32)}</playerkey><name>Guest</name><countrycode>XX</countrycode></WogResponse>`);
            break;
        }
        case 'SetWogcStat': {
            if (
                !req.body.playerkey || String(req.body.playerkey).length !== 32 ||
                !req.body.ballCount || !(parseInt(req.body.ballCount) <= 300) ||
                !req.body.ballCountAttached || !(parseInt(req.body.ballCountAttached) <= parseInt(req.body.ballCount)) ||
                !req.body.height || isNaN(parseFloat(req.body.height))
            ) {
                res.status(400).end("Invalid parameters");
                break;
            }

            res.type('xml');
            res.end(`<WogResponse result="OK"></WogResponse>`);
            break;
        }
        case 'GetWogcStats': {
            if (
                !req.body.playerkey || String(req.body.playerkey).length !== 32
            ) {
                res.status(400).end("Invalid parameters");
                break;
            }

            res.type('xml');
            res.end(`<WogResponse result="OK"><list></list></WogResponse>`);
            break;
        }
        case 'SetLevelStats': {
            if (
                !req.body.playerkey || String(req.body.playerkey).length !== 32 ||
                !req.body.levelid || !utils.constants.levels[req.body.levelid] ||
                !req.body.balls || isNaN(parseInt(req.body.balls)) || parseInt(req.body.balls) < 0 || (utils.constants.levels[req.body.levelid].requirement === 0 && parseInt(req.body.balls) > 0) ||
                !req.body.moves || isNaN(parseInt(req.body.moves)) || parseInt(req.body.moves) < 0 ||
                !req.body.time || isNaN(parseFloat(req.body.time)) || parseFloat(req.body.time) < 0
            ) {
                res.status(400).end("Invalid parameters");
                break;
            }

            res.end();
            break;
        }
        default: {
            res.status(400).end("Invalid opcode");
            utils.logger.warn(`Unknown opcode requested (${req.body.op})`);
            break;
        }
    }
});

app.listen(port, () => {
    utils.logger.info(`Backend listening on 127.0.0.1:${port}`);
})