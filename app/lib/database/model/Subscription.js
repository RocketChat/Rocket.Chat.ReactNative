import { Model } from '@nozbe/watermelondb';
import {
	field, date, json, children
} from '@nozbe/watermelondb/decorators';

export default class Subscription extends Model {
	static table = 'subscriptions';

	static associations = {
		messages: { type: 'has_many', foreignKey: 'rid' },
		threads: { type: 'has_many', foreignKey: 'rid' },
		thread_messages: { type: 'has_many', foreignKey: 'subscription_id' },
		uploads: { type: 'has_many', foreignKey: 'rid' }
	}

	@field('_id') _id;

	@field('f') f;

	@field('t') t;

	@date('ts') ts;

	@date('ls') ls;

	@field('name') name;

	@field('fname') fname;

	@field('rid') rid;

	@field('open') open;

	@field('alert') alert;

	// @field('roles') roles;

	@field('unread') unread;

	@field('user_mentions') userMentions;

	@date('_updated_at') _updatedAt;

	@field('ro') ro;

	@date('last_open') lastOpen;

	@field('description') description;

	@field('announcement') announcement;

	@field('topic') topic;

	@field('blocked') blocked;

	@field('blocker') blocker;

	@field('react_when_read_only') reactWhenReadOnly;

	@field('archived') archived;

	@field('join_code_required') joinCodeRequired;

	@field('notifications') notifications;

	// @field('muted') muted;
	@field('broadcast') broadcast;

	@field('prid') prid;

	@field('draft_message') draftMessage;

	@date('last_thread_sync') lastThreadSync;

	@field('auto_translate') autoTranslate;

	@field('auto_translate_language') autoTranslateLanguage;

	@json('last_message', r => r) lastMessage;

	@children('messages') messages;

	@children('threads') threads;

	@children('thread_messages') threadMessages;
}
