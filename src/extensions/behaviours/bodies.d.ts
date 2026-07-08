// Ambient declaration for bundled behaviour markdown bodies. Bun's bundler
// inlines `import body from "./foo.md" with { type: "text" }` as a string
// constant; this shim lets tsc resolve the same import during typecheck.
// declare module "*.md" {
// 	const content: string
// 	export default content
// }

// Termux/esbuild build: markdown bodies are generated as JS string modules.
declare module "./bodies-gen/*.js" {
	const content: string
	export default content
}
