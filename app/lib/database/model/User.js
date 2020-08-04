import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class User extends Model {
	static table = 'users';

	@field('_id') _id;

	@field('name') name;

	@field('username') username;

	@field('avatar_etag') avatarETag;
}
