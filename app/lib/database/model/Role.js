import { Model, field } from '../facade';

export const ROLES_TABLE = 'roles';

export default class Role extends Model {
	static table = ROLES_TABLE;

	@field('description') description;
}
