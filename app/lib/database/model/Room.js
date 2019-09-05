import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

export default class Room extends Model {
	static table = 'rooms';

	@json('custom_fields', r => r) customFields;

	@field('broadcast') broadcast;

	@field('encrypted') encrypted;

	@field('ro') ro;
}
