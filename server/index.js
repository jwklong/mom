import http from 'http'

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')

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
                sKey: genRanHex(32)
              }
              data.players.push(player)
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({key: player.sKey}))
            break
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