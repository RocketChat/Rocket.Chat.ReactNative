import fs from 'fs';
import path from 'path';

import { transformFileSync } from '@babel/core';

const ROOM_VIEW_DIR = path.resolve(__dirname);
const REPO_ROOT = path.resolve(__dirname, '../../..');

// A11yGate/MessageA11y* live under containers/message but are part of the RoomView compiler contract.
// Named individually (not a directory scan) so pre-existing, unrelated files in that folder aren't pulled in.
const EXTRA_FILES: string[] = [
	path.resolve(__dirname, '../../containers/message/stores/A11yGate.tsx'),
	path.resolve(__dirname, '../../containers/message/components/MessageA11yOrder.tsx'),
	path.resolve(__dirname, '../../containers/message/components/MessageA11yIndex.tsx')
];

// Files the React Compiler silently skips today. Fixing the underlying cause must remove its file from this list.
const KNOWN_SKIPPED: string[] = [
	// Disables a React ESLint rule, which makes the compiler bail out.
	'app/views/RoomView/List/hooks/useMessages.ts',
	// Reads a variable before its declaration.
	'app/views/RoomView/components/ReactionPicker.tsx'
];

const collectSourceFiles = (dir: string): string[] => {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			if (entry.name === '__snapshots__') continue;
			files.push(...collectSourceFiles(fullPath));
			continue;
		}

		if (!/\.tsx?$/.test(entry.name)) continue;
		if (entry.name.includes('.test.')) continue;

		files.push(fullPath);
	}

	return files;
};

const compile = (file: string) =>
	transformFileSync(file, {
		babelrc: false,
		configFile: false,
		presets: [
			['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
			['@babel/preset-react', { runtime: 'automatic' }]
		],
		plugins: [['babel-plugin-react-compiler', { compilationMode: 'infer', panicThreshold: 'all_errors' }]]
	});

describe('React Compiler contract for RoomView', () => {
	const absoluteFiles = [...collectSourceFiles(ROOM_VIEW_DIR), ...EXTRA_FILES];
	const relativeFiles = absoluteFiles.map(file => path.relative(REPO_ROOT, file));

	it('finds RoomView source files to compile', () => {
		expect(relativeFiles.length).toBeGreaterThan(0);
	});

	const cleanFiles = relativeFiles.filter(file => !KNOWN_SKIPPED.includes(file));

	test.each(cleanFiles)('%s compiles without the compiler silently skipping it', relativeFile => {
		const absoluteFile = path.join(REPO_ROOT, relativeFile);
		expect(() => compile(absoluteFile)).not.toThrow();
	});

	// test.each throws on an empty array; the guard keeps the ratchet dormant until a file regresses.
	if (KNOWN_SKIPPED.length) {
		test.each(KNOWN_SKIPPED)('%s is still silently skipped (remove from KNOWN_SKIPPED once fixed)', relativeFile => {
			const absoluteFile = path.join(REPO_ROOT, relativeFile);
			expect(() => compile(absoluteFile)).toThrow();
		});
	}
});
