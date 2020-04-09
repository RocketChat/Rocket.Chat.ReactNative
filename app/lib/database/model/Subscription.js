import { Model } from '@nozbe/watermelondb';
import {
	field, date, json, children
} from '@nozbe/watermelondb/decorators';
import { sanitizer } from '../utils';

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

	@json('roles', sanitizer) roles;

	@field('unread') unread;

	@field('user_mentions') userMentions;

	@date('room_updated_at') roomUpdatedAt;

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

	@json('muted', sanitizer) muted;

	@field('broadcast') broadcast;

	@field('prid') prid;

	@field('draft_message') draftMessage;

	@date('last_thread_sync') lastThreadSync;

	@date('jitsi_timeout') jitsiTimeout;

	@field('auto_translate') autoTranslate;

	@field('auto_translate_language') autoTranslateLanguage;

	@json('last_message', sanitizer) lastMessage;

	@children('messages') messages;

	@children('threads') threads;

	@children('thread_messages') threadMessages;

	@field('hide_unread_status') hideUnreadStatus;

	@json('sys_mes', sanitizer) sysMes;

	@json('uids', sanitizer) uids;

	@json('usernames', sanitizer) usernames;
}
