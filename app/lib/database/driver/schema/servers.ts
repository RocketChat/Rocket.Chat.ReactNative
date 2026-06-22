import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersServersTable = sqliteTable('users', {
	id: text('id').primaryKey(),
	token: text('token'),
	username: text('username'),
	name: text('name'),
	language: text('language'),
	status: text('status'),
	statusText: text('statusText'),
	roles: text('roles'),
	login_email_password: integer('login_email_password', { mode: 'boolean' }),
	show_message_in_main_thread: integer('show_message_in_main_thread', { mode: 'boolean' }),
	avatar_etag: text('avatar_etag'),
	is_from_webview: integer('is_from_webview', { mode: 'boolean' }),
	enable_message_parser_early_adoption: integer('enable_message_parser_early_adoption', { mode: 'boolean' }),
	nickname: text('nickname'),
	bio: text('bio'),
	require_password_change: integer('require_password_change', { mode: 'boolean' })
});

export const serversTable = sqliteTable('servers', {
	id: text('id').primaryKey(),
	name: text('name'),
	icon_url: text('icon_url'),
	use_real_name: integer('use_real_name', { mode: 'boolean' }),
	file_upload_media_type_white_list: text('file_upload_media_type_white_list'),
	file_upload_max_file_size: real('file_upload_max_file_size'),
	rooms_updated_at: real('rooms_updated_at'),
	version: text('version'),
	last_local_authenticated_session: real('last_local_authenticated_session'),
	auto_lock: integer('auto_lock', { mode: 'boolean' }),
	auto_lock_time: real('auto_lock_time'),
	biometry: integer('biometry', { mode: 'boolean' }),
	unique_id: text('unique_id'),
	enterprise_modules: text('enterprise_modules'),
	e2e_enable: integer('e2e_enable', { mode: 'boolean' }),
	supported_versions: text('supported_versions'),
	supported_versions_warning_at: real('supported_versions_warning_at'),
	supported_versions_updated_at: real('supported_versions_updated_at')
});

export const serversHistoryTable = sqliteTable(
	'servers_history',
	{
		id: text('id').primaryKey(),
		url: text('url').notNull(),
		username: text('username'),
		updated_at: real('updated_at').notNull(),
		icon_url: text('icon_url')
	},
	t => [index('servers_history_url_idx').on(t.url)]
);
