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
		}
	]
});
