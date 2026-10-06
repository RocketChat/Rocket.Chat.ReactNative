import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export const ROOMS_TABLE = 'rooms';

export default class Room extends Model {
	static table = ROOMS_TABLE;

	@json('custom_fields', sanitizer, { memo: true }) customFields;

	@field('broadcast') broadcast;

	@field('encrypted') encrypted;

	@field('e2e_key_id') e2eKeyId;

	@field('ro') ro;

	@json('v', sanitizer, { memo: true }) v;

	@json('served_by', sanitizer, { memo: true }) servedBy;

	@field('department_id') departmentId;

	@json('livechat_data', sanitizer, { memo: true }) livechatData;

	@json('tags', sanitizer, { memo: true }) tags;

	@field('avatar_etag') avatarETag;
}
