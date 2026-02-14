module.exports = {
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.ts', '.tsx', '.js', '.ios.js', '.android.js', '.native.js', '.ios.tsx', '.android.tsx']
			},
			typescript: {
				alwaysTryTypes: true,
				project: './tsconfig.json'
			}
		},
		'import/parsers': {
			'@typescript-eslint/parser': ['.ts', '.tsx']
			// plugins: ['@typescript-eslint'],
			// rules: {
			// 	'@typescript-eslint/consistent-type-imports': [
			// 		'error',
			// 		{
			// 			prefer: 'type-imports', // enforce `import type`
			// 			disallowTypeAnnotations: true // disallow `import { type Foo }`
			// 			// fixStyle: 'inline-type-imports' // keeps type imports inline rather than grouped
			// 		}
			// 	]
			// }
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
		ecmaVersion: 2017,
		ecmaFeatures: {
			experimentalObjectRestSpread: true,
			legacyDecorators: true
		}
	},
	plugins: ['jsx-a11y', 'import', 'react-native', '@babel'],
	env: {
		es6: true,
		node: true,
		'react-native/react-native': true
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
		'no-unused-vars': 'off',
		'no-void': 'error',
		'new-cap': 'error',
		'require-await': 'error'
	},
	globals: {
		__DEV__: 'readonly'
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
			plugins: ['@typescript-eslint'],
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
				'no-spaced-func': 'off',
				'no-unused-vars': 'off',
				'no-useless-constructor': 'off',
				'no-use-before-define': 'off',
				'new-cap': 'off',
				'lines-between-class-members': 'off'
			},
			globals: {
				JSX: 'readonly'
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
		}
	]
};
