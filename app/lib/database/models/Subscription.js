import { Model, Q } from '@nozbe/watermelondb';
import { date, field, children } from '@nozbe/watermelondb/decorators';
import lazy from '@nozbe/watermelondb/decorators/lazy';
import action from '@nozbe/watermelondb/decorators/action';

export default class Subscription extends Model {
	static table = 'subscriptions'

	static associations = {
		subscriptions_roles: { type: 'has_many', foreignKey: 'subscription_id' }
	}

	@field('f') f

	@field('t') t

	@date('ts') ts

	@date('ls') ls

	@field('name') name

	@field('fname') fname

	@field('rid') rid

	@field('open') open

	@field('alert') alert

	@field('unread') unread

	@field('user_mentions') userMentions

	@field('ro') ro

	@date('last_open') lastOpen

	@field('description') description

	@field('announcement') announcement

	@field('topic') topic

	@field('blocked') blocked

	@field('blocker') blocker

	@field('react_when_read_only') reactWhenReadOnly

	@field('archived') archived

	@field('join_code_required') joinCodeRequired

	@field('notifications') notifications

	@field('broadcast') broadcast

	// // muted: { type: 'list', objectType: 'usersMuted' },
	@date('room_updated_at') roomUpdatedAt
	// // lastMessage: { type: 'messages', optional: true },

	@lazy
	roles = this.collections
		.get('roles')
		.query(Q.on('subscriptions_roles', 'subscription_id', this.id));

	@children('subscriptions_roles') subscriptions_roles

	@action deleteRoles() {
		this.subscriptions_roles.destroyAllPermanently();
	}

	@action addRole(roleId) {
		return this.collections.get('subscriptions_roles').create((sr) => {
			sr.subscriptionId = this.id;
			sr.roleId = roleId;
		});
	}
}
