import { Model } from '@nozbe/watermelondb';
import { date, field, json } from '@nozbe/watermelondb/decorators';

import { sanitizer } from '../utils';

export const SETTINGS_TABLE = 'settings';

export default class Setting extends Model {
	static table = SETTINGS_TABLE;

	@field('value_as_string') valueAsString;

	@field('value_as_boolean') valueAsBoolean;

	@field('value_as_number') valueAsNumber;

	@json('value_as_array', sanitizer) valueAsArray;

	@date('_updated_at') _updatedAt;
}
