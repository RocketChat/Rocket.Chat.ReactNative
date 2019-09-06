import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
	version: 3,
	tables: [
		tableSchema({
			name: 'users_typing',
			columns: [
				{ name: 'rid', type: 'string', isIndexed: true },
				{ name: 'username', type: 'string', isOptional: true }
			]
		})
	]
});
