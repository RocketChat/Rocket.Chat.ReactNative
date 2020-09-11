import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
	version: 8,
	tables: [
		tableSchema({
			name: 'users',
			columns: [
				{ name: 'token', type: 'string', isOptional: true },
				{ name: 'username', type: 'string', isOptional: true },
				{ name: 'name', type: 'string', isOptional: true },
				{ name: 'language', type: 'string', isOptional: true },
				{ name: 'status', type: 'string', isOptional: true },
				{ name: 'statusText', type: 'string', isOptional: true },
				{ name: 'roles', type: 'string', isOptional: true },
				{ name: 'login_email_password', type: 'boolean', isOptional: true }
			]
		}),
		tableSchema({
			name: 'servers',
			columns: [
				{ name: 'name', type: 'string', isOptional: true },
				{ name: 'icon_url', type: 'string', isOptional: true },
				{ name: 'use_real_name', type: 'boolean', isOptional: true },
				{ name: 'file_upload_media_type_white_list', type: 'string', isOptional: true },
				{ name: 'file_upload_max_file_size', type: 'number', isOptional: true },
				{ name: 'rooms_updated_at', type: 'number', isOptional: true },
				{ name: 'version', type: 'string', isOptional: true },
				{ name: 'last_local_authenticated_session', type: 'number', isOptional: true },
				{ name: 'auto_lock', type: 'boolean', isOptional: true },
				{ name: 'auto_lock_time', type: 'number', isOptional: true },
				{ name: 'biometry', type: 'boolean', isOptional: true },
				{ name: 'unique_id', type: 'string', isOptional: true },
				{ name: 'enterprise_modules', type: 'string', isOptional: true },
				{ name: 'e2e_enable', type: 'boolean', isOptional: true }
			]
		})
	]
});
