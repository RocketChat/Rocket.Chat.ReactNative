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
		}
	]
});
