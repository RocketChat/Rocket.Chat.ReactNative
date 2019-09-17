import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class Upload extends Model {
	static table = 'uploads';

	static associations = {
		subscriptions: { type: 'belongs_to', key: 'rid' }
	}

	@field('path') path;

	@relation('subscriptions', 'rid') subscription;

	@field('name') name;

	@field('description') description;

	@field('size') size;

	@field('type') type;

	@field('store') store;

	@field('progress') progress;

	@field('error') error;
}
