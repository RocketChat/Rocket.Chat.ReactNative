import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
	version: 4,
	tables: [
		tableSchema({
			name: 'servers',
			columns: [
				{ name: 'name', type: 'string', isOptional: true },
				{ name: 'icon_url', type: 'string', isOptional: true }
			]
		})
	]
});
