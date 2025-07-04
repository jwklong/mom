import http from 'http'
import crypto from 'crypto'
import mergeObject from 'lodash.merge'
import fs from 'fs'
import path from 'path'
import url from 'url'
import express from 'express'
import ejs from 'ejs'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

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

let fileExists = fs.existsSync(path.join(__dirname, "data.json"))
if (fileExists) {
  mergeObject(data, JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8")))
}
function saveData() {
  fs.writeFileSync(path.join(__dirname, "data.json"), JSON.stringify(data, null, 4))
}

const server = http.createServer((req, res) => {
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

        player = {
          cKey: params.hwkey,
          sKey: generateKey(),

          name: params.name,

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
        res.end(`<WogResponse result="OK"><playerkey>${player.sKey}</playerkey><name>${player.name}</name><countrycode>GB</countrycode></WogResponse>`)
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
        res.end()
      }
      default: {
        res.statusCode = 400
        res.end()
      }
    }
  })
})

const backendPort = 3000
server.listen(backendPort, () => {
  console.log(`backend listening on ${backendPort}`)
})

const app = express()

app.engine('ejs', ejs.renderFile)
app.use((req, res, next) => {
  res.locals.data = data
  next()
})

app.use(express.static('static'))

app.get('/', (req, res) => {
  res.render(path.join(__dirname, '/pages/index.ejs'))
})

const frontendPort = 8080
app.listen(frontendPort, () => {
  console.log(`frontend listening on ${frontendPort}`)
})