import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export const SERVERS_HISTORY_TABLE = 'servers_history';

export default class ServersHistory extends Model {
	static table = SERVERS_HISTORY_TABLE;

	@field('url') url;

	@field('username') username;

	@readonly @date('updated_at') updatedAt;
}
