import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import minimist from 'minimist'
const argv = minimist(process.argv.slice(2))

const app = express()

const config = {
  fromPort: argv.fromPort ?? 3000,
  to: argv.to
}

if (!config.to) {
  throw "Missing 'to' parameter"
}

const proxyOptions = {
  target: config.to,
  changeOrigin: true
}
app.use('/', createProxyMiddleware(proxyOptions))

app.listen(config.fromPort, () => {
  console.log(`rerouting requests from ${config.fromPort} to ${config.to}`);
})