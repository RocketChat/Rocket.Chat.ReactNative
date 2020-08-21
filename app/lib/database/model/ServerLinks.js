import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class ServerLinks extends Model {
	static table = 'server_links';

	@field('link') link;
}
