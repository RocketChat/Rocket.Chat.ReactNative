import { TActionActiveUsers } from '../../actions/activeUsers';
import { IActionSettings } from '../../actions/settings';
import { TActionEncryption } from '../../actions/encryption';
import { TActionCustomEmojis } from '../../actions/customEmojis';
import { TActionSelectedUsers } from '../../actions/selectedUsers';
import { TActionSortPreferences } from '../../actions/sortPreferences';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IEncryption } from '../../reducers/encryption';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { ISettings } from '../../reducers/settings';
import { TActionUserTyping } from '../../actions/usersTyping';

export interface IApplicationState {
	settings: ISettings;
	login: any;
	meteor: any;
	server: any;
	selectedUsers: ISelectedUsers;
	createChannel: any;
	app: any;
	room: any;
	rooms: any;
	sortPreferences: any;
	share: any;
	customEmojis: any;
	activeUsers: IActiveUsers;
	usersTyping: any;
	inviteLinks: any;
	createDiscussion: any;
	inquiry: any;
	enterpriseModules: any;
	encryption: IEncryption;
	permissions: any;
	roles: any;
}

export type TApplicationActions = TActionActiveUsers &
	TActionSelectedUsers &
	TActionEncryption &
	IActionSettings &
	TActionCustomEmojis &
	TActionSortPreferences &
	TActionUserTyping;
