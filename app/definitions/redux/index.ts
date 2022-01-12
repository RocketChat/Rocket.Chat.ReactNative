import { TActionSelectedUsers } from '../../actions/selectedUsers';
import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionCreateApp } from '../../actions/createChannel';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { ICreateChannel } from '../../reducers/createChannel';

export interface IApplicationState {
	settings: any;
	login: any;
	meteor: any;
	server: any;
	selectedUsers: ISelectedUsers;
	createChannel: ICreateChannel;
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

export type TApplicationActions = TActionActiveUsers & TActionSelectedUsers & TActionCreateApp;
