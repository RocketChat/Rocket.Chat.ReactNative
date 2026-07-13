import fs from 'fs';
import path from 'path';

import { transformFileSync } from '@babel/core';

const ROOM_VIEW_DIR = path.resolve(__dirname);
const REPO_ROOT = path.resolve(__dirname, '../../..');

// Files the React Compiler silently skips today. Fixing the underlying cause must remove its file from this list.
const KNOWN_SKIPPED = [
	'app/views/RoomView/hooks/useRoomLifecycle.ts', // react-hooks/exhaustive-deps suppressions
	'app/views/RoomView/hooks/useOmnichannelPermissions.ts', // react-hooks/exhaustive-deps suppressions
	'app/views/RoomView/List/hooks/useScroll.ts', // react-hooks/exhaustive-deps suppressions
	'app/views/RoomView/hooks/useJumpToMessage.ts', // compiler limitation: value blocks within try/catch (Todo)
	'app/views/RoomView/hooks/useRoomNavigation.ts' // cannot access refs during render (debounce factory in useMemo closes over a ref)
];

const collectUseMemoFiles = (dir: string): string[] => {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			if (entry.name === '__snapshots__') continue;
			files.push(...collectUseMemoFiles(fullPath));
			continue;
		}

		if (!/\.tsx?$/.test(entry.name)) continue;
		if (entry.name.includes('.test.')) continue;

		const content = fs.readFileSync(fullPath, 'utf8');
		if (content.includes("'use memo'")) files.push(fullPath);
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
		plugins: [['babel-plugin-react-compiler', { compilationMode: 'annotation', panicThreshold: 'all_errors' }]]
	});

describe('React Compiler contract for RoomView', () => {
	const absoluteFiles = collectUseMemoFiles(ROOM_VIEW_DIR);
	const relativeFiles = absoluteFiles.map(file => path.relative(REPO_ROOT, file));

	it("finds the expected set of 'use memo' files", () => {
		expect(relativeFiles.length).toBeGreaterThan(0);
	});

	const cleanFiles = relativeFiles.filter(file => !KNOWN_SKIPPED.includes(file));

	test.each(cleanFiles)('%s compiles without the compiler silently skipping it', relativeFile => {
		const absoluteFile = path.join(REPO_ROOT, relativeFile);
		expect(() => compile(absoluteFile)).not.toThrow();
	});

	test.each(KNOWN_SKIPPED)('%s is still silently skipped (remove from KNOWN_SKIPPED once fixed)', relativeFile => {
		const absoluteFile = path.join(REPO_ROOT, relativeFile);
		expect(() => compile(absoluteFile)).toThrow();
	});
});
