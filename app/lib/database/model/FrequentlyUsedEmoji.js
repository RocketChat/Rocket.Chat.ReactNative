import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export const FREQUENTLY_USED_EMOJIS_TABLE = 'frequently_used_emojis';
export default class FrequentlyUsedEmoji extends Model {
	static table = FREQUENTLY_USED_EMOJIS_TABLE;

	@field('content') content;

	@field('extension') extension;

	@field('is_custom') isCustom;

	@field('count') count;
}
