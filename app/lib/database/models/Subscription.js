import { Model, Q } from '@nozbe/watermelondb';
import { readonly, date, lazy, field } from '@nozbe/watermelondb/decorators';

export default class Subscription extends Model {
	static table = 'subscriptions'

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

	@field('last_open') lastOpen

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
	// // roomUpdatedAt: { type: 'date', optional: true },
	// // lastMessage: { type: 'messages', optional: true },
	// // roles: { type: 'list', objectType: 'subscriptionRolesSchema' },
}
