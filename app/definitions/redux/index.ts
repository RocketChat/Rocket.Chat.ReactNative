// ACTIONS
import { TActionSelectedUsers } from '../../actions/selectedUsers';
import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionServer } from '../../actions/server';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { IServer } from '../../reducers/server';

export interface IApplicationState {
	settings: any;
	login: any;
	meteor: any;
	server: IServer;
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
	roles: any;
}

export type TApplicationActions = TActionActiveUsers & TActionSelectedUsers & TActionServer;
