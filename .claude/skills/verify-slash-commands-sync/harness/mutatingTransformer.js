const path = require('path');

const repo = path.resolve(__dirname, '../../../..');
const babelJest = require(require.resolve('babel-jest', { paths: [repo] }));
const mutations = require('./mutations');

const TARGET = path.join('app', 'lib', 'methods', 'getSlashCommands.ts');
const activeMutation = process.env.SC_MUTANT ? mutations[process.env.SC_MUTANT] : undefined;

if (process.env.SC_MUTANT && !activeMutation) {
	throw new Error(`MUTANT_UNKNOWN ${process.env.SC_MUTANT}`);
}

const mutate = (source, filename) => {
	if (!activeMutation || !filename.endsWith(TARGET)) {
		return source;
	}
	if (!source.includes(activeMutation.from)) {
		throw new Error(`MUTANT_STALE ${process.env.SC_MUTANT}`);
	}
	return source.replace(activeMutation.from, activeMutation.to);
};

const babelTransformers = new Map();
const babelTransformerFor = options => {
	const key = JSON.stringify(options);
	if (!babelTransformers.has(key)) {
		babelTransformers.set(key, (babelJest.default ?? babelJest).createTransformer(options));
	}
	return babelTransformers.get(key);
};

module.exports = {
	process(source, filename, options) {
		return babelTransformerFor(options.transformerConfig).process(mutate(source, filename), filename, options);
	},
	getCacheKey(source, filename, options) {
		const babelKey = babelTransformerFor(options.transformerConfig).getCacheKey(mutate(source, filename), filename, options);
		return `${babelKey}:${process.env.SC_MUTANT ?? 'none'}`;
	}
};
