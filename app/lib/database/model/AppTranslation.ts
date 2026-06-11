import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class AppTranslation extends Model {
	static table = 'app_translations';

	@field('key') key!: string;
	@field('value') value!: string;
	@field('language') language!: string;
}
