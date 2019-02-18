import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
	version: 7,
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
		tableSchema({
			name: 'roles',
			columns: [
				{ name: 'description', type: 'string' }
			]
		}),
		tableSchema({
			name: 'permissions',
			columns: [
				{ name: 'updated_at', type: 'number' }
			]
		}),
		tableSchema({
			name: 'permissions_roles',
			columns: [
				{ name: 'permission_id', type: 'string', isIndexed: true },
				{ name: 'role_id', type: 'string', isIndexed: true },
				{ name: 'updated_at', type: 'number' }
			]
		}),
		tableSchema({
			name: 'custom_emojis',
			columns: [
				{ name: 'name', type: 'string', isIndexed: true },
				{ name: 'extension', type: 'string' },
				{ name: 'updated_at', type: 'number' }
			]
		}),
		tableSchema({
			name: 'custom_emojis_aliases',
			columns: [
				{ name: 'alias', type: 'string', isIndexed: true },
				{ name: 'custom_emojis_id', type: 'string', isIndexed: true }
			]
		})
	]
});
