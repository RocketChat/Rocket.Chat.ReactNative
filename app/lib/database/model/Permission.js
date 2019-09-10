import { Model } from '@nozbe/watermelondb';
import { json, date } from '@nozbe/watermelondb/decorators';

export default class Permission extends Model {
	static table = 'permissions';

  @json('roles', r => r) roles;

  @date('_updated_at') _updatedAt;
}
