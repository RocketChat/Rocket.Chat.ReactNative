import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class SubscriptionRoles extends Model {
	static table = 'subscriptions_roles'

	static associations = {
		subscriptions: { type: 'belongs_to', key: 'subscription_id' },
		roles: { type: 'belongs_to', key: 'role_id' }
	}

	@field('subscription_id') subscriptionId

	@field('role_id') roleId
}
