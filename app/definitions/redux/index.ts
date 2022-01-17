import { TActionActiveUsers } from '../../actions/activeUsers';
import { IActionRoles } from '../../actions/roles';
import { TActionSelectedUsers } from '../../actions/selectedUsers';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IRoles } from '../../reducers/roles';
import { ISelectedUsers } from '../../reducers/selectedUsers';

export interface IApplicationState {
	settings: any;
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
	encryption: any;
	permissions: any;
	roles: IRoles;
}

export type TApplicationActions = TActionActiveUsers & TActionSelectedUsers & IActionRoles;
