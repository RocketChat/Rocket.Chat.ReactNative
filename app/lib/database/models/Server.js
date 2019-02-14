import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Server extends Model {
	static table = 'servers'

	@field('name') name

	@field('icon_url') iconUrl
}
