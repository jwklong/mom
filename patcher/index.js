import utils from 'utils';

const executableEnum = utils.executableInfo.executableEnum

export function patch(buffer, port, force = false) {
    let version = utils.executableInfo.getExecutableVersion(buffer)
    if (version === executableEnum.UNKNOWN) {
        utils.logger.error(`Unknown executable version (hash: ${utils.executableInfo._getHash(buffer)})\nPlease check that the file you have entered is correct`);
        process.exit(1);
    }
    let executableInfo = utils.executableInfo.executableInfo[version];
    utils.logger.info(`Version: ${executableInfo.name}`);

    utils.logger.info(`Patched 0/${executableInfo.replacements.length}`);
    let i = 0;
    for (const [find, replace] of executableInfo.replacements) {
        i += 1;
        const findBuffer = Buffer.from(find, 'ascii');
        const replaceBuffer = Buffer.from(replace(port), 'ascii');
    
        let index = buffer.indexOf(findBuffer);
        if (index === -1) {
            if (!force) {
                utils.logger.error(`Failed to patch (${i}/${executableInfo.replacements.length})`);
                process.exit(1);
            } else {
                utils.logger.warn(`Failed to patch (${i}/${executableInfo.replacements.length})`);
            }
        } else {
            replaceBuffer.copy(buffer, index);
            utils.logger.info(`Patched ${i}/${executableInfo.replacements.length}`);
        }
    }

    return buffer;
}