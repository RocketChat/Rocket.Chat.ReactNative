import { Model } from '@nozbe/watermelondb';
import { date, field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export const CUSTOM_EMOJIS_TABLE = 'custom_emojis';

export default class CustomEmoji extends Model {
	static table = CUSTOM_EMOJIS_TABLE;

	@field('name') name;

	@json('aliases', sanitizer) aliases;

	@field('extension') extension;

	@date('_updated_at') _updatedAt;
}
