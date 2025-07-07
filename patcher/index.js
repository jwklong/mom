import { exec, execFileSync } from 'child_process'
import fs from 'fs'
import minimist from 'minimist'
import path from 'path'
import url from 'url'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const argv = minimist(process.argv.slice(2))

const config = {
    file: argv.file,
    mode: argv.mode ?? "host",
    connectTo: argv.connectTo
}

if (!["connect", "host"].includes(config.mode)) {
    throw "Invalid mode"
}

if (config.mode == "connect") {
    if (!config.connectTo) {
        throw "Missing 'connectTo' parameter"
    }
}

if (!config.file) {
    throw "Missing 'file' parameter"
} else if (!fs.existsSync(config.file)) {
    throw "File does not exist"
} else if (!config.file.endsWith(".exe")) {
    throw "Invalid file"
}

const replacers = {
    "https://": "127.0.0.",
    "worldofgoo.com": "1:3000/wogsrvr"
}

let buffer = fs.readFileSync(config.file)
for (const key in replacers) {
    const value = replacers[key]
    const findBuffer = Buffer.from(key, 'ascii')
    const replaceBuffer = Buffer.from(value, 'ascii')
    
    replaceBuffer.copy(buffer, buffer.indexOf(findBuffer))
}

let outputFile = path.join(path.dirname(config.file), "MOM.exe")
fs.writeFileSync(outputFile, buffer)

let jsProcess
console.log(config.mode)
switch (config.mode) {
    case "connect":
        jsProcess = exec(`node ${__dirname}/../router/index.js --to ${config.connectTo}`)
        break
    case "host":
        jsProcess = exec(`node ${__dirname}/../server/index.js`)
        break
}

try {
    execFileSync(outputFile, {
        "cwd": path.dirname(config.file)
    })
} catch {}

jsProcess.kill()

fs.rmSync(outputFile)