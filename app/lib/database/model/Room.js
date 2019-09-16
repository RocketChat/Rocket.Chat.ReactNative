import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export default class Room extends Model {
	static table = 'rooms';

	@json('custom_fields', sanitizer) customFields;

	@field('broadcast') broadcast;

	@field('encrypted') encrypted;

	@field('ro') ro;
}
