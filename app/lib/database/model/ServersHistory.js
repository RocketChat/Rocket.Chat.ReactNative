import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class ServersHistory extends Model {
	static table = 'servers_history';

	@field('url') url;

	@field('username') username;
}
