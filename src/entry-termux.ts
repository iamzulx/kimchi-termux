// Termux entry — lightweight subcommand CLI dispatcher.
// For interactive TUI, use src/entry.ts (the original entry).

import { homedir, platform, arch } from "node:os";
import { resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

// Set env
const auxiliaryDir = process.env.PI_PACKAGE_DIR || resolve(homedir(), ".local", "share", "kimchi");
if (!existsSync(join(auxiliaryDir, "package.json"))) {
	console.error("✗ Package directory not found. Set PI_PACKAGE_DIR or run from the repo.");
	console.error("  export PI_PACKAGE_DIR=~/kimchi/share/kimchi");
	process.exit(1);
}
process.env.PI_PACKAGE_DIR = auxiliaryDir;
process.env.PI_SKIP_VERSION_CHECK = "1";
process.title = "kimchi";

function getVersion(): string {
	try {
		const pkgPath = join(import.meta.dirname, "..", "package.json");
		return JSON.parse(readFileSync(pkgPath, "utf8")).version || "0.0.0";
	} catch {
		return "0.0.0";
	}
}

const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
	case "version":
	case "--version":
	case "-v":
		console.log(`kimchi ${getVersion()}`);
		console.log(`  platform: ${platform()}/${arch()}`);
		console.log(`  node:     ${process.version}`);
		break;

	case "--help":
	case "-h":
	case undefined:
		console.log(`kimchi ${getVersion()}`);
		console.log("");
		console.log("Subcommands:");
		console.log("  version          Print version");
		console.log("  setup            Interactive setup wizard");
		console.log("  login            Log in (browser OAuth)");
		console.log("  config           Manage config");
		console.log("  update           Update Kimchi");
		console.log("  setup-tools      Configure coding tools");
		console.log("  resources        Manage hooks/tools/extensions");
		console.log("  claude           Configure Claude Code");
		console.log("  cursor           Configure Cursor IDE");
		console.log("  opencode         Configure OpenCode");
		console.log("  openclaw         Configure OpenClaw");
		console.log("  gsd2             Install/configure GSD2");
		console.log("");
		console.log("Interactive mode (requires TTY):");
		console.log("  kimchi (no args)  Start interactive coding session");
		break;

	case "setup":
	case "login":
	case "config":
	case "update":
	case "setup-tools":
	case "resources":
	case "claude":
	case "cursor":
	case "opencode":
	case "openclaw":
	case "gsd2":
		console.log(`ℹ Subcommand '${cmd}': requires full interactive TTY for this wizard.`);
		console.log("  Run without args for interactive mode, or");
		console.log(`  \`node src/entry.ts ${cmd}\` (full TypeScript entry).`);
		break;

	default:
		console.log(`✗ Unknown command: ${cmd}`);
		console.log("  Run `kimchi --help` for usage information.");
		process.exit(1);
}
