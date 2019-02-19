import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
	version: 11,
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
		}),
		tableSchema({
			name: 'subscriptions',
			columns: [
				{ name: 'f', type: 'boolean' },
				{ name: 't', type: 'string' },
				{ name: 'ts', type: 'number' },
				{ name: 'ls', type: 'number', isOptional: true },
				{ name: 'name', type: 'string', isIndexed: true },
				{ name: 'fname', type: 'string', isOptional: true },
				{ name: 'rid', type: 'string', isIndexed: true },
				{ name: 'open', type: 'boolean' },
				{ name: 'alert', type: 'boolean' },
				{ name: 'unread', type: 'number', isOptional: true },
				{ name: 'user_mentions', type: 'number', isOptional: true },
				{ name: 'room_updated_at', type: 'number', isOptional: true },
				{ name: 'ro', type: 'boolean' },
				{ name: 'last_open', type: 'number', isOptional: true },
				// lastMessage: { type: 'messages', optional: true },
				{ name: 'description', type: 'string', isOptional: true },
				{ name: 'announcement', type: 'string', isOptional: true },
				{ name: 'topic', type: 'string', isOptional: true },
				{ name: 'blocked', type: 'boolean' },
				{ name: 'blocker', type: 'boolean' },
				{ name: 'react_when_read_only', type: 'boolean' },
				{ name: 'archived', type: 'boolean' },
				{ name: 'join_code_required', type: 'boolean' },
				{ name: 'notifications', type: 'boolean' },
				{ name: 'broadcast', type: 'boolean' },
				// muted: { type: 'list', objectType: 'usersMuted' },
			]
		}),
		tableSchema({
			name: 'subscriptions_roles',
			columns: [
				{ name: 'subscription_id', type: 'string', isIndexed: true },
				{ name: 'role_id', type: 'string', isIndexed: true }
			]
		})
	]
});
