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
		}),
		tableSchema({
			name: 'active_users',
			columns: [
				{ name: 'name', type: 'string' },
				{ name: 'username', type: 'string' },
				{ name: 'status', type: 'string', isOptional: true }
			]
		})
	]
});
