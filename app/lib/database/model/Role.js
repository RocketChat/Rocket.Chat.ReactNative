import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export const ROLES_TABLE = 'roles';

export default class Role extends Model {
	static table = ROLES_TABLE;

	@field('description') description;
}
