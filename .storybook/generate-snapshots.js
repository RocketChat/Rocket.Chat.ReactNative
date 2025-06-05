const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all story files
const storyFiles = glob.sync('../app/**/*.stories.?(ts|tsx|js|jsx)', { cwd: __dirname });

// Create snapshots directory if it doesn't exist
const snapshotsDir = path.join(__dirname, 'snapshots');
if (!fs.existsSync(snapshotsDir)) {
	fs.mkdirSync(snapshotsDir, { recursive: true });
}

function generateTestForStory(storyFile) {
	const relativePath = path.relative('../app', storyFile);
	const testFileName = relativePath.replace(/\.stories\.(ts|tsx|js|jsx)$/, '.snapshots.test.tsx');
	const testFilePath = path.join(snapshotsDir, testFileName);
	
	// Create directory structure if needed
	const testDir = path.dirname(testFilePath);
	if (!fs.existsSync(testDir)) {
		fs.mkdirSync(testDir, { recursive: true });
	}
	
	// Get the story module path for import
	const storyImportPath = path.relative(path.dirname(testFilePath), storyFile).replace(/\.(ts|tsx|js|jsx)$/, '');
	const componentName = path.basename(testFileName, '.snapshots.test.tsx');
	
	// Calculate correct path to test-setup based on test file location
	const testSetupPath = path.relative(path.dirname(testFilePath), path.join(__dirname, 'test-setup'));
	
	const testContent = [
		"import React from 'react';",
		"import { composeStories } from '@storybook/react';",
		"import { renderWithProviders } from '" + testSetupPath + "';",
		"import * as stories from '" + storyImportPath + "';",
		"",
		"const composedStories = composeStories(stories);",
		"",
		"describe('" + componentName + " Snapshots', () => {",
		"	Object.keys(composedStories).forEach(storyName => {",
		"		it('should render ' + storyName + ' correctly', () => {",
		"			const Story = composedStories[storyName];",
		"			const tree = renderWithProviders(Story);",
		"			expect(tree).toMatchSnapshot();",
		"		});",
		"	});",
		"});"
	].join('\n');

	fs.writeFileSync(testFilePath, testContent);
}

// Generate test files
storyFiles.forEach(generateTestForStory);

console.log('Generated snapshot tests for ' + storyFiles.length + ' story files');