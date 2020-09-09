import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ServersHistory extends Model {
	static table = 'servers_history';

	@field('url') url;

	@field('username') username;

	@readonly @date('updated_at') updatedAt
}
