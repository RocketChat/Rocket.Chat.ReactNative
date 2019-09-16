import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class FrequentlyUsedEmoji extends Model {
	static table = 'frequently_used_emojis';

	@field('content') content;

	@field('extension') extension;

	@field('is_custom') isCustom;

	@field('count') count;
}
