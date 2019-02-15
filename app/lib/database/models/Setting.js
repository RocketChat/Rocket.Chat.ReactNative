import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Setting extends Model {
	static table = 'settings'

	@field('value_as_string') valueAsString

	@field('value_as_boolean') valueAsBoolean

	@field('value_as_number') valueAsNumber

	@readonly @date('updated_at') updatedAt
}
