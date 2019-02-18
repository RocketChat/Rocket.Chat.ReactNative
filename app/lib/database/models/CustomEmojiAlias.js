import { Model } from '@nozbe/watermelondb';
import { relation, field } from '@nozbe/watermelondb/decorators';

export default class CustomEmojiAlias extends Model {
	static table = 'custom_emojis_aliases'

	static associations = {
		custom_emojis: { type: 'belongs_to', key: 'custom_emojis_id' }
	}

	@field('alias') alias

	@relation('custom_emojis', 'custom_emojis_id') customEmoji
}
