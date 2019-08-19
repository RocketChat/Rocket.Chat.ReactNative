import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
	version: 8,
	tables: [
		tableSchema({
			name: 'subscriptions',
			columns: [
				{ name: 'f', type: 'boolean' },
				{ name: 't', type: 'string' },
				{ name: 'ts', type: 'number' },
				{ name: 'ls', type: 'number' },
				{ name: 'name', type: 'string' },
				{ name: 'fname', type: 'string' },
				{ name: 'rid', type: 'string' },
				{ name: 'open', type: 'boolean' },
				{ name: 'alert', type: 'boolean' },
				// roles: 'string[]',
				{ name: 'unread', type: 'number' },
				{ name: 'user_mentions', type: 'string' },
				{ name: 'room_updated_at', type: 'number' },
				{ name: 'ro', type: 'boolean' },
				{ name: 'last_open', type: 'number' },
				// { name: 'last_message_id', type: 'string', isIndexed: true },
				{ name: 'last_message', type: 'string' },
				{ name: 'description', type: 'string' },
				{ name: 'announcement', type: 'string' },
				{ name: 'topic', type: 'string' },
				{ name: 'blocked', type: 'boolean' },
				{ name: 'blocker', type: 'boolean' },
				{ name: 'react_when_read_only', type: 'boolean' },
				{ name: 'archived', type: 'boolean' },
				{ name: 'join_code_required', type: 'boolean' },
				{ name: 'notifications', type: 'boolean' },
				// { name: 'muted', type: 'string' },
				{ name: 'broadcast', type: 'boolean' },
				{ name: 'prid', type: 'string' },
				{ name: 'draft_message', type: 'string' },
				{ name: 'last_thread_sync', type: 'number', isOptional: true },
				{ name: 'auto_translate', type: 'boolean' },
				{ name: 'auto_translate_language', type: 'string' }
			]
		}),
		tableSchema({
			name: 'messages',
			columns: [
				{ name: 'msg', type: 'string' },
				{ name: 't', type: 'string' },
				{ name: 'rid', type: 'string' },
				{ name: 'ts', type: 'number' },
				{ name: 'subscription_id', type: 'string', isIndexed: true },
				{ name: 'u', type: 'string' }
			]
		})
	]
});
