import { Model } from '@nozbe/watermelondb';
import { field, relation, date } from '@nozbe/watermelondb/decorators';

export default class Comment extends Model {
	static table = 'messages';

	// static associations = {
	// 	posts: { type: 'belongs_to', key: 'post_id' }
	// };

	static associations = {
		subscriptions: { type: 'belongs_to', key: 'subscription_id' },
	}

	@field('msg') msg;

	@field('t') t;

	@date('ts') ts;

	@relation('subscriptions', 'subscription_id') subscription
}
