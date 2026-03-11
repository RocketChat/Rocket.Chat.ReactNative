const fs = require("fs")
const path = require("path")

const ROOT = path.join(process.cwd(), "app")
const OUTPUT = path.join(process.cwd(), ".maestro/storybook/storybook.yaml")

function findStoryFiles(dir, files = []) {
	const items = fs.readdirSync(dir)

	for (const item of items) {
		const full = path.join(dir, item)
		const stat = fs.statSync(full)

		if (stat.isDirectory()) {
			findStoryFiles(full, files)
			continue
		}

		if (item.endsWith(".stories.tsx") || item.endsWith(".stories.ts")) {
			files.push(full)
		}
	}

	return files
}

function parseStories(file) {
	let content = fs.readFileSync(file, "utf8")

	content = stripComments(content)

	const defaultExport = content.match(/export\s+default\s*{([\s\S]*?)}/)
	if (!defaultExport) return null

	const titleMatch = defaultExport[1].match(/title:\s*['"`](.*?)['"`]/)
	if (!titleMatch) return null

	const title = titleMatch[1]

	const storyMatches = [...content.matchAll(/export const (\w+)/g)]

	const stories = storyMatches
		.map(m => {
			const exportName = m[1]

			return {
				raw: exportName,
				id: storyId(title, exportName)
			}
		})
		.sort((a, b) => a.raw.localeCompare(b.raw))

	return { title, stories }
}

function stripComments(code) {
	return code
		.replace(/\/\/.*$/gm, "")
		.replace(/\/\*[\s\S]*?\*\//g, "")
}

function buildSteps(story) {
	return `
- openLink: "rocketchat://storybook?path=/story/${story.id}"
- assertScreenshot:
    path: ./screenshots/${story.id}.png
    cropOn:
      id: ${story.id}
    thresholdPercentage: 1
    optional: true
`
}

function generateYaml(data) {
	let yaml = `appId: chat.rocket.reactnative
---
`
	data.forEach(item => {
		item.stories.forEach(story => {
			yaml += buildSteps(story)
		})
	})

	return yaml
}

function formatTitle(title) {
	return title
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/\//g, "-")
}

function kebabCase(str) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
		.replace(/([a-zA-Z])([0-9])/g, "$1-$2")
		.replace(/([0-9])([a-zA-Z])/g, "$1-$2")
		.replace(/[\s_]+/g, "-")
		.toLowerCase()
}

function storyId(title, exportName) {
	return `${formatTitle(title)}--${kebabCase(exportName)}`
}

function main() {
	const files = findStoryFiles(ROOT)

	const parsed = files
		.map(parseStories)
		.filter(Boolean)

	const yaml = generateYaml(parsed)

	fs.mkdirSync(".maestro/storybook", { recursive: true })
	fs.writeFileSync(OUTPUT, yaml)

	console.log("Generated:", OUTPUT)
}

main()