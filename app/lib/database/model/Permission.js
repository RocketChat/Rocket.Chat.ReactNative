import { Model } from '@nozbe/watermelondb';
import { field, json, date } from '@nozbe/watermelondb/decorators';

export default class Permission extends Model {
	static table = 'permissions';

  @field('_id') _id;

  @json('roles', r => r) roles;

  @date('_updated_at') _updatedAt;
}
