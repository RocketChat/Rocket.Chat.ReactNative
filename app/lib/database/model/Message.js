import { Model } from '@nozbe/watermelondb';
import { field, relation, date, json } from '@nozbe/watermelondb/decorators';

const sanitizeUser = r => r;

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

	@json('u', sanitizeUser) u;

	@relation('subscriptions', 'subscription_id') subscription
}
