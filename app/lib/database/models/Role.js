import { Model, Q } from '@nozbe/watermelondb';
import { field, lazy } from '@nozbe/watermelondb/decorators';

export default class Role extends Model {
	static table = 'roles'

	static associations = {
		permissions_roles: { type: 'has_many', foreignKey: 'permission_id' },
		subscriptions_roles: { type: 'has_many', foreignKey: 'subscription_id' }
	}

	@field('description') description

	@lazy
	permissions = this.collections
		.get('permissions')
		.query(Q.on('permissions_roles', 'role_id', this.id));

	@lazy
	subscriptions = this.collections
		.get('subscriptions')
		.query(Q.on('subscriptions_roles', 'role_id', this.id));
}
