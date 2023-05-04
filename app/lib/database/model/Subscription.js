import { Model } from '@nozbe/watermelondb';
import { children, date, field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export const SUBSCRIPTIONS_TABLE = 'subscriptions';

export default class Subscription extends Model {
	static table = SUBSCRIPTIONS_TABLE;

	static associations = {
		messages: { type: 'has_many', foreignKey: 'rid' },
		threads: { type: 'has_many', foreignKey: 'rid' },
		thread_messages: { type: 'has_many', foreignKey: 'subscription_id' },
		uploads: { type: 'has_many', foreignKey: 'rid' }
	};

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

	@field('group_mentions') groupMentions;

	@json('tunread', sanitizer) tunread;

	@json('tunread_user', sanitizer) tunreadUser;

	@json('tunread_group', sanitizer) tunreadGroup;

	@date('room_updated_at') roomUpdatedAt;

	@field('ro') ro;

	@date('last_open') lastOpen;

	@field('description') description;

	@field('announcement') announcement;

	@field('banner_closed') bannerClosed;

	@field('topic') topic;

	@field('blocked') blocked;

	@field('blocker') blocker;

	@field('react_when_read_only') reactWhenReadOnly;

	@field('archived') archived;

	@field('join_code_required') joinCodeRequired;

	@field('notifications') notifications;

	@json('muted', sanitizer) muted;

	@json('ignored', sanitizer) ignored;

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

	@field('hide_mention_status') hideMentionStatus;

	@json('sys_mes', sanitizer) sysMes;

	@json('uids', sanitizer) uids;

	@json('usernames', sanitizer) usernames;

	@json('visitor', sanitizer) visitor;

	@field('department_id') departmentId;

	@json('served_by', sanitizer) servedBy;

	@json('livechat_data', sanitizer) livechatData;

	@json('tags', sanitizer) tags;

	@field('e2e_key') E2EKey;

	@field('e2e_suggested_key') E2ESuggestedKey;

	@field('encrypted') encrypted;

	@field('e2e_key_id') e2eKeyId;

	@field('avatar_etag') avatarETag;

	@field('team_id') teamId;

	@field('team_main') teamMain;

	@field('on_hold') onHold;

	@field('users_count') usersCount;

	@json('source', sanitizer) source;
}
