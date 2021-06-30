import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../../utils';

export default class User extends Model {
	static table = 'users';

	@field('token') token;

	@field('username') username;

	@field('name') name;

	@field('language') language;

	@field('status') status;

	@field('statusText') statusText;

	@json('roles', sanitizer) roles;

	@field('avatar_etag') avatarETag;

	@field('login_email_password') loginEmailPassword;

	@field('show_message_in_main_thread') showMessageInMainThread;
}
