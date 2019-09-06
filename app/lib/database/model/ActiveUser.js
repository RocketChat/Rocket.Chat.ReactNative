import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class ActiveUser extends Model {
	static table = 'active_users';

	@field('name') name;

	@field('username') username;

	@field('status') status;
}
