import levels from "./levels.json" with { type: "json" };

export default {
    /**
     * @type {Object<string, {
     *  chapter: number,
     *  name: string,
     *  ocd?: [string, number],
     *  requirement: number
     * }>}
     */
    levels
};