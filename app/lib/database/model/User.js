import { Model, field, json } from '../facade';

import { sanitizer } from '../utils';

export const USERS_TABLE = 'users';

export default class User extends Model {
	static table = USERS_TABLE;

	@field('_id') _id;

	@field('name') name;

	@field('username') username;

	@field('avatar_etag') avatarETag;

	@json('roles', sanitizer) roles;
}
