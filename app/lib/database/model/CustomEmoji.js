import { Model } from '@nozbe/watermelondb';
import { field, date, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export default class CustomEmoji extends Model {
	static table = 'custom_emojis';

	@field('name') name;

	@json('aliases', sanitizer) aliases;

	@field('extension') extension;

	@date('_updated_at') _updatedAt;
}
