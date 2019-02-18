import { Model } from '@nozbe/watermelondb';
import {
	date, children, field
} from '@nozbe/watermelondb/decorators';

export default class CustomEmoji extends Model {
	static table = 'custom_emojis'

	static associations = {
		custom_emojis_aliases: { type: 'has_many', foreignKey: 'custom_emojis_id' }
	}

	@field('name') name

	@field('extension') extension

	@date('updated_at') updatedAt

	@children('custom_emojis_aliases') aliases
}
