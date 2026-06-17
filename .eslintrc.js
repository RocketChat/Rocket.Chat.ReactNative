// Keep the database engine behind the facade. Everything outside app/lib/database/ must import
// from app/lib/database/facade — never the raw engine or the facade's internal modules. The
// migration reader and driver live inside app/lib/database/ and are excluded below.
const reactDefaultImport = {
	name: 'react',
	importNames: ['default'],
	message: 'Import specific named exports from React instead.'
};
const facadeOnlyPatterns = [
	{
		group: ['@nozbe/watermelondb', '@nozbe/watermelondb/**', 'expo-sqlite', 'expo-sqlite/**', 'drizzle-orm', 'drizzle-orm/**'],
		message: 'Do not import the database engine directly. Use the facade at app/lib/database/facade.'
	},
	{
		group: ['**/database/facade/*'],
		message: 'Import from the facade barrel (app/lib/database/facade), not its internal modules.'
	}
];

module.exports = {
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.ts', '.tsx', '.js', '.ios.js', '.android.js', '.native.js', '.ios.tsx', '.android.tsx']
			},
			typescript: {
				project: './tsconfig.json'
			}
		},
		'import/parsers': {
			'@typescript-eslint/parser': ['.ts', '.tsx']
		},
		react: {
			version: 'detect'
		}
	},
	parser: '@babel/eslint-parser',
	extends: [
		'@rocket.chat/eslint-config',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:prettier/recommended',
		'prettier'
	],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2024
	},
	plugins: ['import', 'react-native', '@babel'],
	env: {
		es6: true
	},
	rules: {
		'import/extensions': [
			'error',
			'ignorePackages',
			{
				js: 'warning',
				jsx: 'warning',
				ts: 'warning',
				tsx: 'warning'
			}
		],
		'import/named': 'error',
		'import/no-cycle': 'error',
		'import/no-unresolved': 'error',
		'import/order': [
			'error',
			{
				'newlines-between': 'ignore'
			}
		],
		'react/display-name': 'off',
		'react/jsx-fragments': ['error', 'syntax'],
		'react/jsx-key': 'off',
		'react/no-direct-mutation-state': 'off',
		'react/prop-types': 'off',
		'react/react-in-jsx-scope': 'off',
		'react-hooks/set-state-in-effect': 'warn',
		'react-hooks/immutability': 'warn',
		'react-hooks/refs': 'warn',
		'react-native/no-color-literals': 'off',
		'react-native/no-inline-styles': 'off',
		'react-native/no-raw-text': 'off',
		'react-native/no-single-element-style-arrays': 'error',
		'react-native/no-unused-styles': 'error',
		'react-native/split-platform-components': 'off',
		'no-restricted-imports': [
			'error',
			{
				paths: [
					{
						name: 'react',
						importNames: ['default'],
						message: 'Import specific named exports from React instead.'
					}
				]
			}
		],
		'no-restricted-syntax': [
			'error',
			{
				selector: 'MemberExpression[object.name="React"]',
				message: 'Avoid React.* syntax. Use named imports: import { memo, useState } from "react"'
			}
		],
		'no-unused-vars': 'off',
		'no-void': 'error',
		'new-cap': 'error',
		'require-await': 'error'
	},
	overrides: [
		{
			files: ['**/*.ts', '**/*.tsx'],
			extends: [
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/eslint-recommended',
				'@rocket.chat/eslint-config',
				'plugin:prettier/recommended',
				'prettier'
			],
			parser: '@typescript-eslint/parser',
			rules: {
				'@typescript-eslint/ban-ts-comment': 'off',
				'@typescript-eslint/ban-types': 'off',
				'@typescript-eslint/consistent-type-imports': [
					'error',
					{
						prefer: 'type-imports',
						disallowTypeAnnotations: true,
						fixStyle: 'inline-type-imports'
					}
				],
				'@typescript-eslint/indent': 'off',
				'@typescript-eslint/no-dupe-class-members': 'error',
				'@typescript-eslint/no-empty-function': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-extra-parens': 'off',
				'@typescript-eslint/no-restricted-imports': [
					'error',
					{
						paths: [
							{
								name: 'react',
								importNames: ['default'],
								message: 'Import specific named exports from React instead.'
							}
						]
					}
				],
				'@typescript-eslint/no-unused-vars': [
					'error',
					{
						args: 'all',
						argsIgnorePattern: '^_'
					}
				],
				'@typescript-eslint/no-var-requires': 'off',
				'no-return-assign': 'off',
				'no-dupe-class-members': 'off',
				'no-extra-parens': 'off',
				'no-restricted-imports': 'off',
				'no-spaced-func': 'off',
				'no-unused-vars': 'off',
				'no-useless-constructor': 'off',
				'no-use-before-define': 'off',
				'new-cap': 'off',
				'lines-between-class-members': 'off'
			},
			settings: {
				'import/resolver': {
					node: {
						extensions: ['.js', '.ts', '.tsx']
					}
				}
			}
		},
		{
			files: ['jest.setup.js', '__mocks__/**/*.js', '**/*.test.{js,ts,tsx}'],
			extends: ['plugin:jest/recommended']
		},
		{
			files: ['index.js', 'app/**/*.{js,ts,tsx}'],
			env: {
				'react-native/react-native': true
			}
		},
		{
			files: ['app/**/*.js'],
			excludedFiles: ['app/lib/database/**'],
			rules: {
				'no-restricted-imports': ['error', { paths: [reactDefaultImport], patterns: facadeOnlyPatterns }]
			}
		},
		{
			files: ['app/**/*.{ts,tsx}'],
			excludedFiles: ['app/lib/database/**'],
			rules: {
				'@typescript-eslint/no-restricted-imports': ['error', { paths: [reactDefaultImport], patterns: facadeOnlyPatterns }]
			}
		}
	]
};
