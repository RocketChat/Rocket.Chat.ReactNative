import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
	version: 7,
	tables: [
		tableSchema({
			name: 'subscriptions',
			columns: [
				{ name: '_id', type: 'string' },
				{ name: 'f', type: 'boolean' },
				{ name: 't', type: 'string', isIndexed: true },
				{ name: 'ts', type: 'number' },
				{ name: 'ls', type: 'number' },
				{ name: 'name', type: 'string', isIndexed: true },
				{ name: 'fname', type: 'string' },
				{ name: 'rid', type: 'string', isIndexed: true },
				{ name: 'open', type: 'boolean' },
				{ name: 'alert', type: 'boolean' },
				{ name: 'roles', type: 'string', isOptional: true },
				{ name: 'unread', type: 'number' },
				{ name: 'user_mentions', type: 'number' },
				{ name: 'room_updated_at', type: 'number' },
				{ name: 'ro', type: 'boolean' },
				{ name: 'last_open', type: 'number', isOptional: true },
				{ name: 'last_message', type: 'string', isOptional: true },
				{ name: 'description', type: 'string', isOptional: true },
				{ name: 'announcement', type: 'string', isOptional: true },
				{ name: 'topic', type: 'string', isOptional: true },
				{ name: 'blocked', type: 'boolean', isOptional: true },
				{ name: 'blocker', type: 'boolean', isOptional: true },
				{ name: 'react_when_read_only', type: 'boolean', isOptional: true },
				{ name: 'archived', type: 'boolean' },
				{ name: 'join_code_required', type: 'boolean', isOptional: true },
				{ name: 'muted', type: 'string', isOptional: true },
				{ name: 'broadcast', type: 'boolean', isOptional: true },
				{ name: 'prid', type: 'string', isOptional: true },
				{ name: 'draft_message', type: 'string', isOptional: true },
				{ name: 'last_thread_sync', type: 'number', isOptional: true },
				{ name: 'jitsi_timeout', type: 'number', isOptional: true },
				{ name: 'auto_translate', type: 'boolean', isOptional: true },
				{ name: 'auto_translate_language', type: 'string' },
				{ name: 'hide_unread_status', type: 'boolean', isOptional: true },
				{ name: 'sys_mes', type: 'string', isOptional: true },
				{ name: 'uids', type: 'string', isOptional: true },
				{ name: 'usernames', type: 'string', isOptional: true }
			]
		}),
		tableSchema({
			name: 'rooms',
			columns: [
				{ name: 'custom_fields', type: 'string' },
				{ name: 'broadcast', type: 'boolean' },
				{ name: 'encrypted', type: 'boolean' },
				{ name: 'ro', type: 'boolean' }
			]
		}),
		tableSchema({
			name: 'messages',
			columns: [
				{ name: 'msg', type: 'string', isOptional: true },
				{ name: 't', type: 'string', isOptional: true },
				{ name: 'rid', type: 'string', isIndexed: true },
				{ name: 'ts', type: 'number' },
				{ name: 'u', type: 'string' },
				{ name: 'alias', type: 'string' },
				{ name: 'parse_urls', type: 'string' },
				{ name: 'groupable', type: 'boolean', isOptional: true },
				{ name: 'avatar', type: 'string', isOptional: true },
				{ name: 'attachments', type: 'string', isOptional: true },
				{ name: 'urls', type: 'string', isOptional: true },
				{ name: '_updated_at', type: 'number' },
				{ name: 'status', type: 'number', isOptional: true },
				{ name: 'pinned', type: 'boolean', isOptional: true },
				{ name: 'starred', type: 'boolean', isOptional: true },
				{ name: 'edited_by', type: 'string', isOptional: true },
				{ name: 'reactions', type: 'string', isOptional: true },
				{ name: 'role', type: 'string', isOptional: true },
				{ name: 'drid', type: 'string', isOptional: true },
				{ name: 'dcount', type: 'number', isOptional: true },
				{ name: 'dlm', type: 'number', isOptional: true },
				{ name: 'tmid', type: 'string', isOptional: true },
				{ name: 'tcount', type: 'number', isOptional: true },
				{ name: 'tlm', type: 'number', isOptional: true },
				{ name: 'replies', type: 'string', isOptional: true },
				{ name: 'mentions', type: 'string', isOptional: true },
				{ name: 'channels', type: 'string', isOptional: true },
				{ name: 'unread', type: 'boolean', isOptional: true },
				{ name: 'auto_translate', type: 'boolean', isOptional: true },
				{ name: 'translations', type: 'string', isOptional: true },
				{ name: 'tmsg', type: 'string', isOptional: true },
				{ name: 'blocks', type: 'string', isOptional: true }
			]
		}),
		tableSchema({
			name: 'threads',
			columns: [
				{ name: 'msg', type: 'string', isOptional: true },
				{ name: 't', type: 'string', isOptional: true },
				{ name: 'rid', type: 'string', isIndexed: true },
				{ name: '_updated_at', type: 'number' },
				{ name: 'ts', type: 'number' },
				{ name: 'u', type: 'string' },
				{ name: 'alias', type: 'string', isOptional: true },
				{ name: 'parse_urls', type: 'string', isOptional: true },
				{ name: 'groupable', type: 'boolean', isOptional: true },
				{ name: 'avatar', type: 'string', isOptional: true },
				{ name: 'attachments', type: 'string', isOptional: true },
				{ name: 'urls', type: 'string', isOptional: true },
				{ name: 'status', type: 'number', isOptional: true },
				{ name: 'pinned', type: 'boolean', isOptional: true },
				{ name: 'starred', type: 'boolean', isOptional: true },
				{ name: 'edited_by', type: 'string', isOptional: true },
				{ name: 'reactions', type: 'string', isOptional: true },
				{ name: 'role', type: 'string', isOptional: true },
				{ name: 'drid', type: 'string', isOptional: true },
				{ name: 'dcount', type: 'number', isOptional: true },
				{ name: 'dlm', type: 'number', isOptional: true },
				{ name: 'tmid', type: 'string', isOptional: true },
				{ name: 'tcount', type: 'number', isOptional: true },
				{ name: 'tlm', type: 'number', isOptional: true },
				{ name: 'replies', type: 'string', isOptional: true },
				{ name: 'mentions', type: 'string', isOptional: true },
				{ name: 'channels', type: 'string', isOptional: true },
				{ name: 'unread', type: 'boolean', isOptional: true },
				{ name: 'auto_translate', type: 'boolean', isOptional: true },
				{ name: 'translations', type: 'string', isOptional: true }
			]
		}),
		tableSchema({
			name: 'thread_messages',
			columns: [
				{ name: 'msg', type: 'string', isOptional: true },
				{ name: 't', type: 'string', isOptional: true },
				{ name: 'rid', type: 'string', isIndexed: true },
				{ name: 'subscription_id', type: 'string', isIndexed: true },
				{ name: '_updated_at', type: 'number' },
				{ name: 'ts', type: 'number' },
				{ name: 'u', type: 'string' },
				{ name: 'alias', type: 'string', isOptional: true },
				{ name: 'parse_urls', type: 'string', isOptional: true },
				{ name: 'groupable', type: 'boolean', isOptional: true },
				{ name: 'avatar', type: 'string', isOptional: true },
				{ name: 'attachments', type: 'string', isOptional: true },
				{ name: 'urls', type: 'string', isOptional: true },
				{ name: 'status', type: 'number', isOptional: true },
				{ name: 'pinned', type: 'boolean', isOptional: true },
				{ name: 'starred', type: 'boolean', isOptional: true },
				{ name: 'edited_by', type: 'string', isOptional: true },
				{ name: 'reactions', type: 'string', isOptional: true },
				{ name: 'role', type: 'string', isOptional: true },
				{ name: 'drid', type: 'string', isOptional: true },
				{ name: 'dcount', type: 'number', isOptional: true },
				{ name: 'dlm', type: 'number', isOptional: true },
				{ name: 'tcount', type: 'number', isOptional: true },
				{ name: 'tlm', type: 'number', isOptional: true },
				{ name: 'replies', type: 'string', isOptional: true },
				{ name: 'mentions', type: 'string', isOptional: true },
				{ name: 'channels', type: 'string', isOptional: true },
				{ name: 'unread', type: 'boolean', isOptional: true },
				{ name: 'auto_translate', type: 'boolean', isOptional: true },
				{ name: 'translations', type: 'string', isOptional: true }
			]
		}),
		tableSchema({
			name: 'custom_emojis',
			columns: [
				{ name: 'name', type: 'string', isOptional: true },
				{ name: 'aliases', type: 'string', isOptional: true },
				{ name: 'extension', type: 'string' },
				{ name: '_updated_at', type: 'number' }
			]
		}),
		tableSchema({
			name: 'frequently_used_emojis',
			columns: [
				{ name: 'content', type: 'string', isOptional: true },
				{ name: 'extension', type: 'string', isOptional: true },
				{ name: 'is_custom', type: 'boolean' },
				{ name: 'count', type: 'number' }
			]
		}),
		tableSchema({
			name: 'uploads',
			columns: [
				{ name: 'path', type: 'string', isOptional: true },
				{ name: 'rid', type: 'string', isIndexed: true },
				{ name: 'name', type: 'string', isOptional: true },
				{ name: 'description', type: 'string', isOptional: true },
				{ name: 'size', type: 'number' },
				{ name: 'type', type: 'string', isOptional: true },
				{ name: 'store', type: 'string', isOptional: true },
				{ name: 'progress', type: 'number' },
				{ name: 'error', type: 'boolean' }
			]
		}),
		tableSchema({
			name: 'settings',
			columns: [
				{ name: 'value_as_string', type: 'string', isOptional: true },
				{ name: 'value_as_boolean', type: 'boolean', isOptional: true },
				{ name: 'value_as_number', type: 'number', isOptional: true },
				{ name: 'value_as_array', type: 'string', isOptional: true },
				{ name: '_updated_at', type: 'number', isOptional: true }
			]
		}),
		tableSchema({
			name: 'roles',
			columns: [
				{ name: 'description', type: 'string', isOptional: true }
			]
		}),
		tableSchema({
			name: 'permissions',
			columns: [
				{ name: 'roles', type: 'string' },
				{ name: '_updated_at', type: 'number', isOptional: true }
			]
		}),
		tableSchema({
			name: 'slash_commands',
			columns: [
				{ name: 'params', type: 'string', isOptional: true },
				{ name: 'description', type: 'string', isOptional: true },
				{ name: 'client_only', type: 'boolean', isOptional: true },
				{ name: 'provides_preview', type: 'boolean', isOptional: true },
				{ name: 'app_id', type: 'string', isOptional: true }
			]
		})
	]
});
