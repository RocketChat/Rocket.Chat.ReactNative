import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
	migrations: [
		{
			toVersion: 2,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'jitsi_timeout', type: 'number', isOptional: true }]
				})
			]
		},
		{
			toVersion: 3,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'hide_unread_status', type: 'boolean', isOptional: true }]
				})
			]
		},
		{
			toVersion: 4,
			steps: [
				addColumns({
					table: 'messages',
					columns: [{ name: 'blocks', type: 'string', isOptional: true }]
				}),
				addColumns({
					table: 'slash_commands',
					columns: [{ name: 'app_id', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 5,
			steps: [
				addColumns({
					table: 'settings',
					columns: [{ name: 'value_as_array', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 6,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'sys_mes', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 7,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [
						{ name: 'uids', type: 'string', isOptional: true },
						{ name: 'usernames', type: 'string', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 8,
			steps: [
				addColumns({
					table: 'messages',
					columns: [{ name: 'emoji', type: 'string', isOptional: true }]
				}),
				addColumns({
					table: 'thread_messages',
					columns: [{ name: 'emoji', type: 'string', isOptional: true }]
				}),
				addColumns({
					table: 'threads',
					columns: [{ name: 'emoji', type: 'string', isOptional: true }]
				}),
				addColumns({
					table: 'subscriptions',
					columns: [
						{ name: 'banner_closed', type: 'boolean', isOptional: true },
						{ name: 'visitor', type: 'string', isOptional: true },
						{ name: 'department_id', type: 'string', isOptional: true },
						{ name: 'served_by', type: 'string', isOptional: true },
						{ name: 'livechat_data', type: 'string', isOptional: true },
						{ name: 'tags', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'rooms',
					columns: [
						{ name: 'v', type: 'string', isOptional: true },
						{ name: 'department_id', type: 'string', isOptional: true },
						{ name: 'served_by', type: 'string', isOptional: true },
						{ name: 'livechat_data', type: 'string', isOptional: true },
						{ name: 'tags', type: 'string', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 9,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'group_mentions', type: 'number', isOptional: true }]
				})
			]
		},
		{
			toVersion: 10,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [
						{ name: 'e2e_key', type: 'string', isOptional: true },
						{ name: 'encrypted', type: 'boolean', isOptional: true },
						{ name: 'e2e_key_id', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'messages',
					columns: [{ name: 'e2e', type: 'string', isOptional: true }]
				}),
				addColumns({
					table: 'thread_messages',
					columns: [{ name: 'e2e', type: 'string', isOptional: true }]
				}),
				addColumns({
					table: 'threads',
					columns: [{ name: 'e2e', type: 'string', isOptional: true }]
				}),
				addColumns({
					table: 'rooms',
					columns: [{ name: 'e2e_key_id', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 11,
			steps: [
				addColumns({
					table: 'messages',
					columns: [{ name: 'tshow', type: 'boolean', isOptional: true }]
				}),
				createTable({
					name: 'users',
					columns: [
						{ name: '_id', type: 'string', isIndexed: true },
						{ name: 'name', type: 'string', isOptional: true },
						{ name: 'username', type: 'string', isIndexed: true },
						{ name: 'avatar_etag', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'subscriptions',
					columns: [
						{ name: 'tunread', type: 'string', isOptional: true },
						{ name: 'tunread_user', type: 'string', isOptional: true },
						{ name: 'tunread_group', type: 'string', isOptional: true },
						{ name: 'avatar_etag', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'rooms',
					columns: [{ name: 'avatar_etag', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 12,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'ignored', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 13,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [
						{ name: 'team_id', type: 'string', isIndexed: true },
						{ name: 'team_main', type: 'boolean', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 14,
			steps: [
				addColumns({
					table: 'messages',
					columns: [{ name: 'md', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 15,
			steps: [
				addColumns({
					table: 'threads',
					columns: [{ name: 'draft_message', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 16,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'source', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 17,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'on_hold', type: 'boolean', isOptional: true }]
				}),
				addColumns({
					table: 'messages',
					columns: [{ name: 'comment', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 18,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'hide_mention_status', type: 'boolean', isOptional: true }]
				})
			]
		},
		{
			toVersion: 19,
			steps: [
				addColumns({
					table: 'uploads',
					columns: [{ name: 'tmid', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 20,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'e2e_suggested_key', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 21,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'users_count', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 22,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'sanitized_fname', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 23,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'unmuted', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 24,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [{ name: 'disable_notifications', type: 'boolean', isOptional: true }]
				})
			]
		},
		{
			toVersion: 25,
			steps: [
				addColumns({
					table: 'messages',
					columns: [{ name: 'content', type: 'string', isOptional: true }]
				}),
				addColumns({
					table: 'threads',
					columns: [{ name: 'content', type: 'string', isOptional: true }]
				}),
				addColumns({
					table: 'thread_messages',
					columns: [{ name: 'content', type: 'string', isOptional: true }]
				})
			]
		},
		{
			toVersion: 26,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [
						{ name: 'users_waiting_for_e2e_keys', type: 'string', isOptional: true },
						{ name: 'old_room_keys', type: 'string', isOptional: true }
					]
				})
			]
		}
	]
});
