import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
	migrations: [
		{
			toVersion: 2,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [
						{ name: 'jitsi_timeout', type: 'number', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 3,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [
						{ name: 'hide_unread_status', type: 'boolean', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 4,
			steps: [
				addColumns({
					table: 'messages',
					columns: [
						{ name: 'blocks', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'slash_commands',
					columns: [
						{ name: 'app_id', type: 'string', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 5,
			steps: [
				addColumns({
					table: 'settings',
					columns: [
						{ name: 'value_as_array', type: 'string', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 6,
			steps: [
				addColumns({
					table: 'subscriptions',
					columns: [
						{ name: 'sys_mes', type: 'string', isOptional: true }
					]
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
					columns: [
						{ name: 'emoji', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'thread_messages',
					columns: [
						{ name: 'emoji', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'threads',
					columns: [
						{ name: 'emoji', type: 'string', isOptional: true }
					]
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
					columns: [
						{ name: 'group_mentions', type: 'number', isOptional: true }
					]
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
					columns: [
						{ name: 'e2e', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'thread_messages',
					columns: [
						{ name: 'e2e', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'threads',
					columns: [
						{ name: 'e2e', type: 'string', isOptional: true }
					]
				}),
				addColumns({
					table: 'rooms',
					columns: [
						{ name: 'e2e_key_id', type: 'string', isOptional: true }
					]
				})
			]
		}
	]
});
