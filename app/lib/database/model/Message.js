import { Model } from '@nozbe/watermelondb';
import { date, field, json, relation } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export const MESSAGES_TABLE = 'messages';

export default class Message extends Model {
	static table = MESSAGES_TABLE;

	static associations = {
		subscriptions: { type: 'belongs_to', key: 'rid' }
	};

	@field('msg') msg;

	@field('t') t;

	@date('ts') ts;

	@json('u', sanitizer) u;

	@relation('subscriptions', 'rid') subscription;

	@field('alias') alias;

	@json('parse_urls', sanitizer) parseUrls;

	@field('groupable') groupable;

	@field('avatar') avatar;

	@field('emoji') emoji;

	@json('attachments', sanitizer) attachments;

	@json('urls', sanitizer) urls;

	@date('_updated_at') _updatedAt;

	@field('status') status;

	@field('pinned') pinned;

	@field('starred') starred;

	@json('edited_by', sanitizer) editedBy;

	@json('reactions', sanitizer) reactions;

	@field('role') role;

	@field('drid') drid;

	@field('dcount') dcount;

	@date('dlm') dlm;

	@field('tmid') tmid;

	@field('tcount') tcount;

	@date('tlm') tlm;

	@json('replies', sanitizer) replies;

	@json('mentions', sanitizer) mentions;

	@json('channels', sanitizer) channels;

	@field('unread') unread;

	@field('auto_translate') autoTranslate;

	@json('translations', sanitizer) translations;

	@field('tmsg') tmsg;

	@json('blocks', sanitizer) blocks;

	@field('e2e') e2e;

	@field('tshow') tshow;

	@json('md', sanitizer) md;

	@json('content', sanitizer) content;

	@field('comment') comment;

	asPlain() {
		return {
			id: this.id,
			rid: this.subscription.id,
			msg: this.msg,
			t: this.t,
			ts: this.ts,
			u: this.u,
			alias: this.alias,
			parseUrls: this.parseUrls,
			groupable: this.groupable,
			avatar: this.avatar,
			emoji: this.emoji,
			attachments: this.attachments,
			urls: this.urls,
			_updatedAt: this._updatedAt,
			status: this.status,
			pinned: this.pinned,
			starred: this.starred,
			editedBy: this.editedBy,
			reactions: this.reactions,
			role: this.role,
			drid: this.drid,
			dcount: this.dcount,
			dlm: this.dlm,
			tmid: this.tmid,
			tcount: this.tcount,
			tlm: this.tlm,
			replies: this.replies,
			mentions: this.mentions,
			channels: this.channels,
			unread: this.unread,
			autoTranslate: this.autoTranslate,
			translations: this.translations,
			tmsg: this.tmsg,
			blocks: this.blocks,
			e2e: this.e2e,
			tshow: this.tshow,
			md: this.md,
			content: this.content,
			comment: this.comment
		};
	}
}
