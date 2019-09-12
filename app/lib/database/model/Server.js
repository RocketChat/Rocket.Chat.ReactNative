import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Server extends Model {
	static table = 'servers';

	@field('name') name;

	@field('icon_url') iconURL;

	@field('use_real_name') useRealName;

	@field('file_upload_media_type_white_list') FileUpload_MediaTypeWhiteList;

	@field('file_upload_max_file_size') FileUpload_MaxFileSize;

	@date('rooms_updated_at') roomsUpdatedAt;

	@field('version') version;
}
