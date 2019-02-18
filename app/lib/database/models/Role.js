import { Model, Q } from '@nozbe/watermelondb';
import { field, lazy } from '@nozbe/watermelondb/decorators';

export default class Role extends Model {
	static table = 'roles'

	static associations = {
		role_permissions: { type: 'has_many', foreignKey: 'permission_id' }
	}

	@field('description') description

	@lazy
	permissions = this.collections
		.get('permissions')
		.query(Q.on('role_permissions', 'role_id', this.id));
}
