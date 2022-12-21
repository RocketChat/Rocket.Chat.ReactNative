import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export const UPLOADS_TABLE = 'uploads';

export default class Upload extends Model {
	static table = UPLOADS_TABLE;

	static associations = {
		subscriptions: { type: 'belongs_to', key: 'rid' }
	};

	@field('path') path;

	@relation('subscriptions', 'rid') subscription;

	@field('name') name;

	@field('tmid') tmid;

	@field('description') description;

	@field('size') size;

	@field('type') type;

	@field('store') store;

	@field('progress') progress;

	@field('error') error;
}
