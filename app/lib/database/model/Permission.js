import { Model } from '@nozbe/watermelondb';
import { json, date } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export default class Permission extends Model {
	static table = 'permissions';

	@json('roles', sanitizer) roles;

	@date('_updated_at') _updatedAt;
}
