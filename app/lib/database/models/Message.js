import { Model, Q } from '@nozbe/watermelondb';
import { date, field, relation, readonly } from '@nozbe/watermelondb/decorators';
import lazy from '@nozbe/watermelondb/decorators/lazy';
import action from '@nozbe/watermelondb/decorators/action';

export default class Message extends Model {
	static table = 'messages'

	// needs Subscription association or rid query is enough?

	@field('msg') msg

	@field('t') t

	@date('ts') ts

	@field('alias') alias

	@field('groupable') groupable

	@field('avatar') avatar

	@readonly @date('updated_at') updatedAt

	@field('status') status

	@field('pinned') pinned

	@field('starred') starred

	@field('role') role

	@field('rid') rid

	// rid
	// u
	// parseUrls????
	// attachments
	// urls
	// editedBy
	// reactions

	// @lazy
	// roles = this.collections
	// 	.get('roles')
	// 	.query(Q.on('subscriptions_roles', 'subscription_id', this.id));

	// @children('subscriptions_roles') subscriptions_roles

	// @action deleteRoles() {
	// 	this.subscriptions_roles.destroyAllPermanently();
	// }

	// @action addRole(roleId) {
	// 	return this.collections.get('subscriptions_roles').create((sr) => {
	// 		sr.subscriptionId = this.id;
	// 		sr.roleId = roleId;
	// 	});
	// }
}