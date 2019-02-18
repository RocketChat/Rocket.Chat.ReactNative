import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class PermissionRoles extends Model {
	static table = 'permissions_roles'

	static associations = {
		permissions: { type: 'belongs_to', key: 'permission_id' },
		roles: { type: 'belongs_to', key: 'role_id' }
	}

	@field('permission_id') permissionId

	@field('role_id') roleId

	@readonly @date('updated_at') updatedAt
}
