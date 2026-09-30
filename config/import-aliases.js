const fs = require('fs');
const path = require('path');

const tsconfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tsconfig.json'), 'utf8'));
const paths = tsconfig.compilerOptions.paths;

const entries = Object.entries(paths).sort(([left], [right]) => right.length - left.length);

const stripWildcard = value => value.replace(/\*$/, '');
const stripAliasSuffix = value => stripWildcard(value).replace(/\/$/, '');
const relativeTarget = value => stripAliasSuffix(value).replace(/^\.\//, '');
const relativeTargetWithSlash = value => stripWildcard(value).replace(/^\.\//, '');

const getAliasConfig = () => ({
	babel: Object.fromEntries(entries.map(([key, [value]]) => [stripAliasSuffix(key), `./${relativeTarget(value)}`])),
	jest: Object.fromEntries(
		entries.map(([key, [value]]) => [
			`^${stripWildcard(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.*)$`,
			`<rootDir>/${relativeTargetWithSlash(value)}$1`
		])
	)
});

module.exports = getAliasConfig;
