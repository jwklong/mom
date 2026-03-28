import crypto from 'node:crypto'

export const executableEnum = {
    UNKNOWN: null,
    WINDOWS1_20: "1.20win",
    WINDOWS1_30: "1.30win",
    LINUX1_41_64: "1.41linux64"
}

export const executableInfo = {
    [executableEnum.UNKNOWN]: {
        name: "Unknown Version",
        hashes: [],
        replacements: []
    },
    [executableEnum.WINDOWS1_20]: {
        name: "v1.20 (Windows)",
        hashes: [],
        replacements: [
            ["https://", _ => "127.0.0."],
            ["worldofgoo.com", port => `1:${port}/${"a".repeat(12 - String(port).length)}`]
        ]
    },
    [executableEnum.WINDOWS1_30]: {
        name: "v1.30 (Windows)",
        hashes: [
            "7c4bd28a597032fd530037c2b746e51d7944cc6de9f9b334257f091c5dea380e"
        ],
        replacements: [
            ["https://", _ => "127.0.0."],
            ["worldofgoo.com", port => `1:${port}/${"a".repeat(12 - String(port).length)}`],
            ["1.20win", _ => "1.30win"]
        ]
    },
    [executableEnum.LINUX1_41_64]: {
        name: "v1.41 (Linux, x64)",
        hashes: [],
        replacements: [
            ["https://", _ => "127.0.0."],
            ["worldofgoo.com", port => `1:${port}/${"a".repeat(12 - String(port).length)}`]
        ]
    }
}

export const executableHashes = Object.fromEntries(Object.entries(executableInfo).map(v => v[1].hashes.map(h => [h, v[0]])).flat());

export function _getHash(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

export function getExecutableVersion(buf) {
    const hash = _getHash(buf);
    return executableHashes[hash] ?? executableEnum.UNKNOWN;
}