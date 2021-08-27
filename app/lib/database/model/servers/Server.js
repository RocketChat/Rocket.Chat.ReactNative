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

	@date('last_local_authenticated_session') lastLocalAuthenticatedSession;

	@field('auto_lock') autoLock;

	@field('auto_lock_time') autoLockTime;

	@field('biometry') biometry;

	@field('unique_id') uniqueID;

	@field('enterprise_modules') enterpriseModules;

	@field('e2e_enable') E2E_Enable;
}
