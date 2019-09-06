import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class UserTyping extends Model {
	static table = 'users_typing';

	@field('rid') rid;

	@field('username') username;
}
