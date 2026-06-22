import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const subscriptionsTable = sqliteTable(
	'subscriptions',
	{
		id: text('id').primaryKey(),
		_id: text('_id').notNull(),
		f: integer('f', { mode: 'boolean' }).notNull(),
		t: text('t').notNull(),
		ts: real('ts').notNull(),
		ls: real('ls').notNull(),
		name: text('name').notNull(),
		fname: text('fname').notNull(),
		sanitized_fname: text('sanitized_fname'),
		rid: text('rid').notNull(),
		open: integer('open', { mode: 'boolean' }).notNull(),
		alert: integer('alert', { mode: 'boolean' }).notNull(),
		roles: text('roles'),
		unread: real('unread').notNull(),
		user_mentions: real('user_mentions').notNull(),
		group_mentions: real('group_mentions').notNull(),
		tunread: text('tunread'),
		tunread_user: text('tunread_user'),
		tunread_group: text('tunread_group'),
		room_updated_at: real('room_updated_at').notNull(),
		ro: integer('ro', { mode: 'boolean' }).notNull(),
		last_open: real('last_open'),
		last_message: text('last_message'),
		description: text('description'),
		announcement: text('announcement'),
		banner_closed: integer('banner_closed', { mode: 'boolean' }),
		topic: text('topic'),
		blocked: integer('blocked', { mode: 'boolean' }),
		blocker: integer('blocker', { mode: 'boolean' }),
		react_when_read_only: integer('react_when_read_only', { mode: 'boolean' }),
		archived: integer('archived', { mode: 'boolean' }).notNull(),
		join_code_required: integer('join_code_required', { mode: 'boolean' }),
		muted: text('muted'),
		ignored: text('ignored'),
		broadcast: integer('broadcast', { mode: 'boolean' }),
		prid: text('prid'),
		draft_message: text('draft_message'),
		last_thread_sync: real('last_thread_sync'),
		jitsi_timeout: real('jitsi_timeout'),
		auto_translate: integer('auto_translate', { mode: 'boolean' }),
		auto_translate_language: text('auto_translate_language').notNull(),
		hide_unread_status: integer('hide_unread_status', { mode: 'boolean' }),
		sys_mes: text('sys_mes'),
		uids: text('uids'),
		usernames: text('usernames'),
		visitor: text('visitor'),
		department_id: text('department_id'),
		served_by: text('served_by'),
		livechat_data: text('livechat_data'),
		tags: text('tags'),
		e2e_key: text('e2e_key'),
		old_room_keys: text('old_room_keys'),
		e2e_suggested_key: text('e2e_suggested_key'),
		encrypted: integer('encrypted', { mode: 'boolean' }),
		e2e_key_id: text('e2e_key_id'),
		users_waiting_for_e2e_keys: text('users_waiting_for_e2e_keys'),
		avatar_etag: text('avatar_etag'),
		team_id: text('team_id').notNull(),
		team_main: integer('team_main', { mode: 'boolean' }),
		on_hold: integer('on_hold', { mode: 'boolean' }),
		source: text('source'),
		hide_mention_status: integer('hide_mention_status', { mode: 'boolean' }),
		users_count: real('users_count'),
		unmuted: text('unmuted'),
		disable_notifications: integer('disable_notifications', { mode: 'boolean' }),
		federated: integer('federated', { mode: 'boolean' }),
		abac_attributes: text('abac_attributes'),
		federation: text('federation'),
		status: text('status'),
		inviter: text('inviter')
	},
	t => [
		index('subscriptions_t_idx').on(t.t),
		index('subscriptions_name_idx').on(t.name),
		index('subscriptions_rid_idx').on(t.rid),
		index('subscriptions_team_id_idx').on(t.team_id)
	]
);

export const roomsTable = sqliteTable('rooms', {
	id: text('id').primaryKey(),
	custom_fields: text('custom_fields').notNull(),
	broadcast: integer('broadcast', { mode: 'boolean' }).notNull(),
	encrypted: integer('encrypted', { mode: 'boolean' }).notNull(),
	ro: integer('ro', { mode: 'boolean' }).notNull(),
	v: text('v'),
	department_id: text('department_id'),
	served_by: text('served_by'),
	livechat_data: text('livechat_data'),
	tags: text('tags'),
	e2e_key_id: text('e2e_key_id'),
	avatar_etag: text('avatar_etag')
});

// Columns shared by messages, threads, and thread_messages.
// alias/parse_urls are nullable here (threads & thread_messages); messagesTable overrides both to notNull.
const messageColumns = {
	msg: text('msg'),
	t: text('t'),
	rid: text('rid').notNull(),
	_updated_at: real('_updated_at').notNull(),
	ts: real('ts').notNull(),
	u: text('u').notNull(),
	alias: text('alias'),
	parse_urls: text('parse_urls'),
	groupable: integer('groupable', { mode: 'boolean' }),
	avatar: text('avatar'),
	emoji: text('emoji'),
	attachments: text('attachments'),
	urls: text('urls'),
	status: real('status'),
	pinned: integer('pinned', { mode: 'boolean' }),
	starred: integer('starred', { mode: 'boolean' }),
	edited_by: text('edited_by'),
	reactions: text('reactions'),
	role: text('role'),
	drid: text('drid'),
	dcount: real('dcount'),
	dlm: real('dlm'),
	tcount: real('tcount'),
	tlm: real('tlm'),
	replies: text('replies'),
	mentions: text('mentions'),
	channels: text('channels'),
	unread: integer('unread', { mode: 'boolean' }),
	auto_translate: integer('auto_translate', { mode: 'boolean' }),
	translations: text('translations'),
	e2e: text('e2e'),
	content: text('content')
};

export const messagesTable = sqliteTable(
	'messages',
	{
		id: text('id').primaryKey(),
		...messageColumns,
		alias: text('alias').notNull(),
		parse_urls: text('parse_urls').notNull(),
		tmid: text('tmid'),
		tmsg: text('tmsg'),
		blocks: text('blocks'),
		tshow: integer('tshow', { mode: 'boolean' }),
		md: text('md'),
		comment: text('comment')
	},
	t => [index('messages_rid_idx').on(t.rid)]
);

export const threadsTable = sqliteTable(
	'threads',
	{
		id: text('id').primaryKey(),
		...messageColumns,
		tmid: text('tmid'),
		draft_message: text('draft_message')
	},
	t => [index('threads_rid_idx').on(t.rid)]
);

export const threadMessagesTable = sqliteTable(
	'thread_messages',
	{
		id: text('id').primaryKey(),
		...messageColumns,
		subscription_id: text('subscription_id').notNull()
	},
	t => [index('thread_messages_rid_idx').on(t.rid), index('thread_messages_subscription_id_idx').on(t.subscription_id)]
);

export const customEmojisTable = sqliteTable('custom_emojis', {
	id: text('id').primaryKey(),
	name: text('name'),
	aliases: text('aliases'),
	extension: text('extension').notNull(),
	_updated_at: real('_updated_at').notNull()
});

export const frequentlyUsedEmojisTable = sqliteTable('frequently_used_emojis', {
	id: text('id').primaryKey(),
	content: text('content'),
	extension: text('extension'),
	is_custom: integer('is_custom', { mode: 'boolean' }).notNull(),
	count: real('count').notNull()
});

export const uploadsTable = sqliteTable(
	'uploads',
	{
		id: text('id').primaryKey(),
		path: text('path'),
		rid: text('rid').notNull(),
		name: text('name'),
		tmid: text('tmid'),
		description: text('description'),
		size: real('size').notNull(),
		type: text('type'),
		store: text('store'),
		progress: real('progress').notNull(),
		error: integer('error', { mode: 'boolean' }).notNull()
	},
	t => [index('uploads_rid_idx').on(t.rid)]
);

export const settingsTable = sqliteTable('settings', {
	id: text('id').primaryKey(),
	value_as_string: text('value_as_string'),
	value_as_boolean: integer('value_as_boolean', { mode: 'boolean' }),
	value_as_number: real('value_as_number'),
	value_as_array: text('value_as_array'),
	_updated_at: real('_updated_at')
});

export const rolesTable = sqliteTable('roles', {
	id: text('id').primaryKey(),
	description: text('description')
});

export const permissionsTable = sqliteTable('permissions', {
	id: text('id').primaryKey(),
	roles: text('roles').notNull(),
	_updated_at: real('_updated_at')
});

export const slashCommandsTable = sqliteTable('slash_commands', {
	id: text('id').primaryKey(),
	params: text('params'),
	description: text('description'),
	client_only: integer('client_only', { mode: 'boolean' }),
	provides_preview: integer('provides_preview', { mode: 'boolean' }),
	app_id: text('app_id')
});

export const usersAppTable = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(),
		_id: text('_id').notNull(),
		name: text('name'),
		username: text('username').notNull(),
		avatar_etag: text('avatar_etag')
	},
	t => [index('users_id_idx').on(t._id), index('users_username_idx').on(t.username)]
);
