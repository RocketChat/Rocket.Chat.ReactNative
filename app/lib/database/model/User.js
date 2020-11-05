import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export default class User extends Model {
	static table = 'users';

	@field('_id') _id;

	@field('name') name;

	@field('username') username;

	@field('avatar_etag') avatarETag;

	@field('login_email_password') loginEmailPassword;

	@field('show_message_in_main_thread') showMessageInMainThread;

	@json('roles', sanitizer) roles;
}
