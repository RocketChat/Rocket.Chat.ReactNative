import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionSelectedUsers } from '../../actions/selectedUsers';
import { IActionSettings } from '../../actions/settings';
import { TActionEncryption } from '../../actions/encryption';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IEncryption } from '../../reducers/encryption';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { ISettings } from '../../reducers/settings';

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

export type TApplicationActions = TActionActiveUsers & TActionSelectedUsers & TActionEncryption & IActionSettings;
