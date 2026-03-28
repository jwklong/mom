export function ansiText(text, color, bgColor) {
    const parseColor = v => {
        v = v.toLowerCase();
        let match;
        if (match = v.match(/#([0-9a-f]{3})/)) {
            return [
                parseInt(match[1][0].repeat(2), 16),
                parseInt(match[1][1].repeat(2), 16),
                parseInt(match[1][2].repeat(2), 16)
            ];
        } else if (match = v.match(/#([0-9a-f]{6})/)) {
            return [
                parseInt(match[1][0] + match[1][1], 16),
                parseInt(match[1][2] + match[1][3], 16),
                parseInt(match[1][4] + match[1][5], 16)
            ];
        } else {
            throw "Invalid color";
        }
    }

    let output = "";

    if (color) {
        let colorParsed = parseColor(color)
        output += `\x1b[38;2;${colorParsed[0]};${colorParsed[1]};${colorParsed[2]}m`;
    }

    if (bgColor) {
        let bgColorParsed = parseColor(bgColor)
        output += `\x1b[48;2;${bgColorParsed[0]};${bgColorParsed[1]};${bgColorParsed[2]}m`;
    }

    output += text;

    output += "\x1b[0m";
    return output;
}

function logHelper(text, titleText, color) {
    let output = "";
    output += ansiText(`${titleText.padStart(6, " ")} `, "#000", color);
    let lines = text.split("\n");
    for (let i in lines) {
        if (i > 0) {
            output += "\n";
            output += ansiText(" ".repeat(7), "#000", color);
        }
        output += ansiText(" " + lines[i], color);
    }
    return output;
}

export const info = text => console.log(logHelper(text, "INFO", "#ddd"));
export const warn = text => console.warn(logHelper(text, "WARN", "#ec4"));
export const error = text => console.error(logHelper(text, "ERROR", "#f57"));