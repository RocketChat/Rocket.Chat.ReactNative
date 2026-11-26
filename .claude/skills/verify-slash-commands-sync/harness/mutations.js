module.exports = {
	'single-page': {
		from: 'total = page.total;',
		to: 'total = 0;'
	},
	'offset-always-zero': {
		from: 'offset: commands.length,',
		to: 'offset: 0,'
	},
	'unsorted-pages': {
		from: 'sort: SORTED_BY_COMMAND',
		to: 'sort: undefined'
	},
	'save-partial-on-failure': {
		from: 'if (!page.success || page.appsLoaded === false) {\n\t\t\treturn;',
		to: 'if (!page.success || page.appsLoaded === false) {\n\t\t\tbreak;'
	},
	'trust-apps-not-loaded': {
		from: 'if (!page.success || page.appsLoaded === false) {',
		to: 'if (!page.success) {'
	},
	'require-apps-loaded-true': {
		from: 'page.appsLoaded === false',
		to: 'page.appsLoaded !== true'
	},
	'keep-unlisted-records': {
		from: 'return record.prepareDestroyPermanently();',
		to: 'return null;'
	},
	'no-dedupe': {
		from: '[...commandsById.values()]',
		to: 'commands'
	},
	'keep-paging-after-workspace-switch': {
		from: 'if (database.active !== db) {\n\t\t\treturn;',
		to: 'if (false) {\n\t\t\treturn;'
	},
	'save-partial-after-workspace-switch': {
		from: 'if (database.active !== db) {\n\t\t\treturn;',
		to: 'if (database.active !== db) {\n\t\t\tbreak;'
	},
	'save-into-active-workspace': {
		from: 'await saveSlashCommands(db, commands);',
		to: 'await saveSlashCommands(database.active, commands);'
	}
};
