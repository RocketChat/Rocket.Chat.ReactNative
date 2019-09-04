import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class User extends Model {
	static table = 'users';

	@field('token') token;

	@field('username') username;

	@field('name') name;

	@field('language') language;

	@field('status') status;
}
