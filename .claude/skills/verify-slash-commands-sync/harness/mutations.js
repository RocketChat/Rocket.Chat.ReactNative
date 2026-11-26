module.exports = {
	'single-page': {
		from: 'const hasMorePages = page.commands.length > 0 && commands.length < page.total;',
		to: 'const hasMorePages = false;'
	},
	'offset-always-zero': {
		from: 'offset: fetched.length,',
		to: 'offset: 0,'
	},
	'save-partial-on-failure': {
		from: 'if (!page.success || page.appsLoaded === false) {\n\t\treturn null;',
		to: 'if (!page.success || page.appsLoaded === false) {\n\t\treturn fetched;'
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
		from: 'return database.active === db ? fetchSlashCommands(db, commands) : null;',
		to: 'return fetchSlashCommands(db, commands);'
	},
	'save-partial-after-workspace-switch': {
		from: 'return database.active === db ? fetchSlashCommands(db, commands) : null;',
		to: 'return database.active === db ? fetchSlashCommands(db, commands) : commands;'
	},
	'save-into-active-workspace': {
		from: 'await saveSlashCommands(db, commands);',
		to: 'await saveSlashCommands(database.active, commands);'
	}
};
