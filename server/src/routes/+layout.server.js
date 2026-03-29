import minimist from "minimist";
let argv = minimist(process.argv.slice(4));

export async function load() {
	return {
		backendPort: argv.backendPort ?? 3000
	};
}