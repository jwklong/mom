import countries from "./countries.json" with { type: "json" };
import levels from "./levels.json" with { type: "json" };

export default {
    countries,
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