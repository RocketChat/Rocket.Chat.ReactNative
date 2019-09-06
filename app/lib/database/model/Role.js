import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Role extends Model {
	static table = 'roles';

  @field('_id') _id;

	@field('description') description;
}
