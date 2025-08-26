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
import ip from 'ip'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const argv = minimist(process.argv.slice(2))

import levels from './constants/levels.json' with {type: 'json'}

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

function requestPlayer(key) {
  let player = data.players.find(v => v.sKey == key)
  if (player) {
    player.lastOnline = Date.now()
    player.created ??= Date.now()
  }
  return player
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
  fs.writeFileSync(dataLocation+'.backup', JSON.stringify(data, null, 4))
  fs.copyFileSync(dataLocation+'.backup', dataLocation)
  fs.rmSync(dataLocation+'.backup')
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
        if (!params.hwkey || String(params.hwkey).length !== 32 || !params.name || String(params.name).length == 0) {
          res.statusCode = 400
          res.end("Missing paramaters")
        }

        let player = {
          cKey: String(params.hwkey),
          sKey: generateKey(),

          name: String(params.name),
          id: randomHex(32),
          country: geoip.lookup(ip)?.country ?? "XX",
          lastOnline: Date.now(),
          created: Date.now(),

          wogc: {
            ballCount: 0,
            ballCountAttached: 0,
            height: 0,
            heightRecord: 0,
            lastUpdated: 0
          },

          levels: {}
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

        let player = requestPlayer(params.playerkey)
        if (!player) {
          res.statusCode = 400
          res.end("Invalid player key")
          break
        }

        player.wogc.ballCount = Math.floor(Math.max(Number(params.ballCount) || 0, 0))
        player.wogc.ballCountAttached = Math.floor(Math.max(Math.min(Number(params.ballCountAttached) || 0, 300), 0))
        player.wogc.height = Math.max(Math.min(Number(params.height) || 0, player.wogc.ballCountAttached * 0.75), 0)
        if (player.wogc.height == player.wogc.ballCountAttached * 0.75) player.wogc.height = 0
        player.wogc.heightRecord = Math.max(player.wogc.heightRecord ?? 0, player.wogc.height)
        player.wogc.lastUpdated = Date.now()
        saveData()

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/xml')
        res.end(`<WogResponse result="OK"><rank>${ordinal(data.players.sort((a, b) => b.wogc.height - a.wogc.height).indexOf(player)+1)}</rank></WogResponse>`)
        res.end()
        break
      }
      case "GetWogcStats": {
        let player = requestPlayer(params.playerkey)
        if (player) player.wogc.lastUpdated = Date.now()
        
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/xml')
        res.end(`<WogResponse result="OK"><list>${data.players.filter(v => v !== player && (!params.height || Math.abs(v.wogc.height - Number(params.height)) <= 10)).map(v => {
          return `<HighTowerStat player_id="${v.id}" player_name="${v.name}" height="${v.wogc.height}" heightMax="${v.wogc.height}" ballCount="${Math.min(v.wogc.ballCount, 300)}" ballCountAttached="${v.wogc.ballCountAttached}" countryCode="${v.country}"></HighTowerStat>`
        }).join("")}</list></WogResponse>`)
        break
      }
      case "SetLevelStats": {
        if (!params.playerkey || !params.levelid || !params.balls || !params.moves || !params.time) {
          res.statusCode = 400
          res.end("Missing paramaters")
          break
        }

        let player = requestPlayer(params.playerkey)
        if (!player) {
          res.statusCode = 400
          res.end("Invalid player key")
          break
        }

        let level = levels[params.levelid]
        if (!level) {
          res.statusCode = 400
          res.end("Invalid level id")
          break
        }

        params.balls = Math.floor(Math.max(Number(params.balls) || 0, 0))
        params.moves = Math.floor(Math.max(Number(params.moves) || 0, 0))
        params.time = Math.floor(Math.max(Number(params.time) || 0, 0))

        if (params.balls < level.requirement || (params.balls == 0 && params.balls !== level.requirement)) {
          res.statusCode = 400
          res.end("Invalid")
        }

        player.levels ??= {}
        player.levels[params.levelid] ??= {
          balls: {balls: params.balls, moves: params.moves, time: params.time},
          moves: {balls: params.balls, moves: params.moves, time: params.time},
          time: {balls: params.balls, moves: params.moves, time: params.time}
        }

        if (player.levels[params.levelid].balls.balls < params.balls) player.levels[params.levelid].balls = {balls: params.balls, moves: params.moves, time: params.time}
        if (player.levels[params.levelid].moves.moves > params.moves) player.levels[params.levelid].moves = {balls: params.balls, moves: params.moves, time: params.time}
        if (player.levels[params.levelid].time.time > params.time) player.levels[params.levelid].time = {balls: params.balls, moves: params.moves, time: params.time}

        saveData()

        res.statusCode = 200
        res.end(``)
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
  res.locals.query = req.query
  res.locals.levels = levels
  res.locals.connectAddress = argv.displayConnectAddress ?? `${ip.address()}:${backendPort}`
  res.locals.htmlEncode = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&#34;')
  next()
})

app.use('/static', express.static(path.join(__dirname, 'static')))

app.get('/', (req, res) => {
  res.render(path.join(__dirname, '/pages/index.ejs'))
})

app.get('/towers', (req, res) => {
  res.render(path.join(__dirname, '/pages/towers.ejs'))
})

app.get('/levels', (req, res) => {
  res.render(path.join(__dirname, '/pages/levels.ejs'))
})

app.get('/level/:id', (req, res, next) => {
  if (!levels[req.params.id]) return next()
  res.render(path.join(__dirname, '/pages/level.ejs'), req.params)
})

app.get('/player/:id', (req, res) => {
  res.render(path.join(__dirname, '/pages/player.ejs'), req.params)
})

app.use((req, res) => {
  res.status(404)
  res.render(path.join(__dirname, '/pages/404.ejs'))
})

const frontendPort = argv.frontendPort ?? 8080 
app.listen(frontendPort, () => {
  console.log(`frontend listening on ${frontendPort}`)
})
