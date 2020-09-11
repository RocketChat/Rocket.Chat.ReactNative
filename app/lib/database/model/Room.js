import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export default class Room extends Model {
	static table = 'rooms';

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
}
