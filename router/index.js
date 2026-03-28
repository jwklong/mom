import express from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import utils from 'utils';

export function router(fromPort, to) {
    const app = express();

    app.use('/', express.urlencoded({ extended: true }));
    app.use('/', (req, res, next) => {
        utils.logger.info(`Rerouted request (${req.body.op})`);
        next();
    });

    app.use('/', createProxyMiddleware({
        target: to,
        changeOrigin: true,
        on: {
            proxyReq: fixRequestBody
        }
    }));

    app.listen(fromPort, () => {
        utils.logger.info(`Rerouting requests from 127.0.0.1:${fromPort} to ${to}`);
    });
}