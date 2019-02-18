import { Model, Q } from '@nozbe/watermelondb';
import { readonly, date, lazy } from '@nozbe/watermelondb/decorators';

export default class Permission extends Model {
	static table = 'permissions'

	static associations = {
		permission_roles: { type: 'has_many', foreignKey: 'role_id' }
	}

	@readonly @date('updated_at') updatedAt

	@lazy
	roles = this.collections
		.get('roles')
		.query(Q.on('permission_roles', 'permission_id', this.id));
}
