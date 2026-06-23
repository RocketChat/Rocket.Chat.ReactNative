import { Model, date, json } from '../facade';

import { sanitizer } from '../utils';

export const PERMISSIONS_TABLE = 'permissions';

export default class Permission extends Model {
	static table = PERMISSIONS_TABLE;

	@json('roles', sanitizer) roles;

	@date('_updated_at') _updatedAt;
}
