import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../../utils';

export const LOGGED_USERS_TABLE = 'users';

export default class User extends Model {
	static table = LOGGED_USERS_TABLE;

	@field('token') token;

	@field('username') username;

	@field('name') name;

	@field('language') language;

	@field('status') status;

	@field('statusText') statusText;

	@json('roles', sanitizer) roles;

	@field('avatar_etag') avatarETag;

	@field('show_message_in_main_thread') showMessageInMainThread;

	@field('is_from_webview') isFromWebView;

	@field('enable_message_parser_early_adoption') enableMessageParserEarlyAdoption;

	@field('nickname') nickname;

	@field('bio') bio;

	@field('require_password_change') requirePasswordChange;
}
