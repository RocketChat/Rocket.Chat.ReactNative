import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Server extends Model {
	static table = 'servers';

	@field('name') name;

	@field('iconURL') iconURL;

	@field('useRealName') useRealName;

	@field('FileUpload_MediaTypeWhiteList') FileUpload_MediaTypeWhiteList;

	@field('FileUpload_MaxFileSize') FileUpload_MaxFileSize;

	@date('roomsUpdatedAt') roomsUpdatedAt;

	@field('version') version;
}
