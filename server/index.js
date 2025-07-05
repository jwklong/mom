import http from 'http'
import crypto from 'crypto'
import mergeObject from 'lodash.merge'
import fs from 'fs'
import path from 'path'
import url from 'url'
import express from 'express'
import ejs from 'ejs'
import ordinal from 'ordinal'
import minimist from 'minimist'
import geoip from 'geoip-country'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const argv = minimist(process.argv.slice(2))

const randomHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')

function generateKey() {
  const hexDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']

  const bytes = new Uint8Array(16)
  crypto.randomFillSync(bytes)

  const chars = new Array(32)
  for (let i = 0; i < 16; ++i) {
    const byte = bytes[i];
    chars[i * 2] = hexDigits[byte & 0xf];
    chars[i * 2 + 1] = hexDigits[(byte >> 4) & 0xf];
  }

  return `0000ffff${chars.join("").substring(8)}`
}

let data = {
  players: []
}

let dataLocation = argv.dataLocation ?? path.join(__dirname, "data.json")
let fileExists = fs.existsSync(dataLocation)
if (fileExists) {
  mergeObject(data, JSON.parse(fs.readFileSync(dataLocation, "utf8")))
}
function saveData() {
  fs.writeFileSync(dataLocation, JSON.stringify(data, null, 4))
}

const server = http.createServer((req, res) => {
  let ip = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress

  let body = ""
  req.on('data', (chunk) => {
    body += chunk.toString()
  });

  req.on('end', () => {
    let params = Object.fromEntries(decodeURIComponent(body).split("&").map(v => v.split("=")))

    console.log(params)

    switch (params.op) {
      case "GetPlayerKey": {
        if (!params.hwkey || !params.name) {
          res.statusCode = 400
          res.end("Missing paramaters")
        }

        let player = {
          cKey: params.hwkey,
          sKey: generateKey(),

          name: params.name,
          id: randomHex(32),
          country: geoip.lookup(ip)?.country ?? "XX",

          wogc: {
            ballCount: 0,
            ballCountAttached: 0,
            height: 0
          }
        }
        data.players.push(player)
        saveData()

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/xml')
        res.end(`<WogResponse result="OK"><playerkey>${player.sKey}</playerkey><name>${player.name}</name><countrycode>${player.country}</countrycode></WogResponse>`)
        break
      }
      case "SetWogcStat": {
        if (!params.playerkey || !params.ballCount || !params.ballCountAttached || !params.height) {
          res.statusCode = 400
          res.end("Missing paramaters")
          break
        }

        let player = data.players.find(v => v.sKey == params.playerkey)
        if (!player) {
          res.statusCode = 400
          res.end("Invalid player key")
          break
        }

        player.wogc.ballCount = Number(params.ballCount)
        player.wogc.ballCountAttached = Number(params.ballCountAttached)
        player.wogc.height = Number(params.height)
        saveData()

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/xml')
        res.end(`<WogResponse result="OK"><rank>${ordinal(data.players.sort((a, b) => b.wogc.height - a.wogc.height).indexOf(player)+1)}</rank></WogResponse>`)
        res.end()
        break
      }
      case "GetWogcStats": {
        let player = data.players.find(v => v.sKey == params.playerkey)

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/xml')
        res.end(`<WogResponse result="OK"><list>${data.players.filter(v => v !== player && (!params.height || Math.abs(v.wogc.height - Number(params.height)) <= 10)).map(v => {
          return `<HighTowerStat player_id="${v.id}" player_name="${v.name}" height="${v.wogc.height}" heightMax="${v.wogc.height}" ballCount="${v.wogc.ballCount}" ballCountAttached="${v.wogc.ballCountAttached}" countryCode="${v.country}"></HighTowerStat>`
        }).join("")}</list></WogResponse>`)
        break
      }
      default: {
        res.statusCode = 400
        res.end("Unknown op code")
      }
    }
  })
})

const backendPort = argv.backendPort ?? 3000
server.listen(backendPort, () => {
  console.log(`backend listening on ${backendPort}`)
})

const app = express()

app.engine('ejs', ejs.renderFile)
app.use((req, res, next) => {
  res.locals.data = data
  next()
})

app.use('/static', express.static(path.join(__dirname, 'static')))

app.get('/', (req, res) => {
  res.render(path.join(__dirname, '/pages/index.ejs'))
})

const frontendPort = argv.frontendPort ?? 8080 
app.listen(frontendPort, () => {
  console.log(`frontend listening on ${frontendPort}`)
})