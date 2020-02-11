module.exports = {
	"settings": {
		"import/resolver": {
			"node": {
				"extensions": [".ios.ts", ".android.ts", ".native.ts", ".tsx", ".ts"]
			}
		}
	},
	"parser": "@typescript-eslint/parser",
	"extends": ["plugin:@typescript-eslint/recommended"],
	"plugins": [
		"@typescript-eslint/eslint-plugin"
	],
	"parserOptions": {
		"ecmaVersion": 2018,
		"sourceType": "module"
	},
	"rules": {
		"react/jsx-indent": [2, 4],
		"react/jsx-indent-props": [2, 4],
		"indent": [2, 4, {"SwitchCase": 4}],
		"react/jsx-filename-extension": [1, {
			"extensions": [".ts", ".tsx"]
		}],
		"import/no-extraneous-dependencies": [
			"error", {
				"devDependencies": false,
				"optionalDependencies": false,
				"peerDependencies": false,
				"packageDir": "./"
			}
		]
	},
};
