import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
	version: 4,
	tables: [
		tableSchema({
			name: 'settings',
			columns: [
				{ name: 'value_as_string', type: 'string', isOptional: true },
				{ name: 'value_as_boolean', type: 'boolean', isOptional: true },
				{ name: 'value_as_number', type: 'number', isOptional: true },
				{ name: 'updated_at', type: 'number' }
			]
		}),
		// tableSchema({
		// 	name: 'permissions',
		// 	columns: [
		// 		{ name: 'updated_at', type: 'number' }
		// 	]
		// }),
		tableSchema({
			name: 'roles',
			columns: [
				{ name: 'description', type: 'string' }
			]
		})
	]
});
