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
		}
	]
});
