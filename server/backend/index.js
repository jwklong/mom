import express from 'express';
import utils from 'utils';
import minimist from 'minimist';

const randomHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

let argv = minimist(process.argv.slice(3));

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

app.use('/', express.urlencoded({ extended: true }));

app.use('/', (req, res, next) => {
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