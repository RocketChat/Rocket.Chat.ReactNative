import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
	migrations: [
		{
			toVersion: 3,
			steps: [
				addColumns({
					table: 'users',
					columns: [
						{ name: 'statusText', type: 'string', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 4,
			steps: [
				addColumns({
					table: 'servers',
					columns: [
						{ name: 'last_local_authenticated_session', type: 'number', isOptional: true },
						{ name: 'auto_lock', type: 'boolean', isOptional: true },
						{ name: 'auto_lock_time', type: 'number', isOptional: true },
						{ name: 'biometry', type: 'boolean', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 5,
			steps: [
				addColumns({
					table: 'servers',
					columns: [
						{ name: 'unique_id', type: 'string', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 6,
			steps: [
				addColumns({
					table: 'servers',
					columns: [
						{ name: 'enterprise_modules', type: 'string', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 7,
			steps: [
				addColumns({
					table: 'users',
					columns: [
						{ name: 'login_email_password', type: 'boolean', isOptional: true }
					]
				})
			]
		},
		{
			toVersion: 8,
			steps: [
				addColumns({
					table: 'servers',
					columns: [
						{ name: 'e2e_enable', type: 'boolean', isOptional: true }
					]
				})
			]
		}
	]
});
