import { Model } from '@nozbe/watermelondb';
import {
	field, relation, date, json
} from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export const TABLE_NAME = 'messages';

export default class Message extends Model {
	static table = TABLE_NAME;

	static associations = {
		subscriptions: { type: 'belongs_to', key: 'rid' }
	}

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
}
