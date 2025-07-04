import http from 'http'
import crypto from 'crypto'

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

            let player = data.players.find(v => v.cKey == params.hwkey)
            if (!player) {
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
            }

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

            player.wogc.ballCount = params.ballCount
            player.wogc.ballCountAttached = params.ballCountAttached
            player.wogc.height = params.height

            console.log(data)

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

const port = 3000;
server.listen(port, () => {
    console.log(`listening on ${port}`)
})