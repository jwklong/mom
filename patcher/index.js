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
}

const replacers = {
    "https://": "127.0.0.",
    "worldofgoo.com": "1:3000/wogsrvr"
}

let writeFile
if (process.platform == 'linux') {
    if (fs.existsSync(config.file + '.bin')) { //1.40
        writeFile = config.file + '.bin'
    } else { //1.41
        if (process.arch == 'x64') {
            writeFile = config.file + '.bin64'
        } else {
            writeFile = config.file + '.bin32'
        }
    }
} else {
    writeFile = config.file
}
let buffer = fs.readFileSync(writeFile)
let originalBuffer = fs.readFileSync(writeFile)
for (const key in replacers) {
    const value = replacers[key]
    const findBuffer = Buffer.from(key, 'ascii')
    const replaceBuffer = Buffer.from(value, 'ascii')
    
    let index = buffer.indexOf(findBuffer)
    if (index == -1) throw "Invalid file"

    replaceBuffer.copy(buffer, index)
}

fs.renameSync(writeFile, writeFile + '.backup')
fs.writeFileSync(writeFile, buffer)
fs.chmodSync(writeFile, fs.constants.S_IRWXU | fs.constants.S_IRWXO)

process.on('SIGINT', () => {
    jsProcess.kill()
    fs.rmSync(writeFile)
    fs.copyFileSync(writeFile + '.backup', writeFile)
    fs.chmodSync(writeFile, fs.constants.S_IRWXU | fs.constants.S_IRWXO)
    fs.rmSync(writeFile + '.backup')
})

try {
    let jsProcess
    switch (config.mode) {
        case "connect":
            jsProcess = exec(`node ${__dirname}/../router/index.js --to ${config.connectTo}`)
            break
        case "host":
            jsProcess = exec(`node ${__dirname}/../server/index.js`)
            break
    }

    try {
        execFileSync(config.file, {
            "cwd": path.dirname(config.file)
        })
    } catch {}

    jsProcess.kill()
} catch (e) {
    console.error(e)
}

fs.rmSync(writeFile)
fs.copyFileSync(writeFile + '.backup', writeFile)
fs.chmodSync(writeFile, fs.constants.S_IRWXU | fs.constants.S_IRWXO)
fs.rmSync(writeFile + '.backup')