import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
	version: 1,
	tables: [
		tableSchema({
			name: 'user',
			columns: [
				{ name: 'token', type: 'string', isOptional: true },
				{ name: 'username', type: 'string', isOptional: true },
				{ name: 'name', type: 'string', isOptional: true },
				{ name: 'language', type: 'string', isOptional: true },
				{ name: 'status', type: 'string', isOptional: true }
			]
		}),
		tableSchema({
			name: 'servers',
			columns: [
				{ name: 'name', type: 'string', isOptional: true },
				{ name: 'iconURL', type: 'string', isOptional: true },
				{ name: 'useRealName', type: 'boolean', isOptional: true },
				{ name: 'FileUpload_MediaTypeWhiteList', type: 'string', isOptional: true },
				{ name: 'FileUpload_MaxFileSize', type: 'number', isOptional: true },
				{ name: 'roomsUpdatedAt', type: 'number', isOptional: true },
				{ name: 'version', type: 'string', isOptional: true }
			]
		})
	]
});
