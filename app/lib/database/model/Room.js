import { Model, field, json } from '../facade';

import { sanitizer } from '../utils';

export const ROOMS_TABLE = 'rooms';

export default class Room extends Model {
	static table = ROOMS_TABLE;

	@json('custom_fields', sanitizer) customFields;

	@field('broadcast') broadcast;

	@field('encrypted') encrypted;

	@field('e2e_key_id') e2eKeyId;

	@field('ro') ro;

	@json('v', sanitizer) v;

	@json('served_by', sanitizer) servedBy;

	@field('department_id') departmentId;

	@json('livechat_data', sanitizer) livechatData;

	@json('tags', sanitizer) tags;

	@field('avatar_etag') avatarETag;
}
