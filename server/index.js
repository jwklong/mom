import http from 'http'

let data = {
  players: {

  }
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
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({key: params.hwkey}))
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