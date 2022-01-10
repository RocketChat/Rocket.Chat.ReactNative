import { TActionSelectedUsers } from '../../actions/selectedUsers';
import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionApp } from '../../actions/app';
import { TActionCreateChannel } from '../../actions/createChannel';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { IApp } from '../../reducers/app';
import { IConnect } from '../../reducers/connect';
import { ICreateChannel } from '../../reducers/createChannel';

export interface IApplicationState {
	settings: any;
	login: any;
	meteor: IConnect;
	server: any;
	selectedUsers: ISelectedUsers;
	createChannel: ICreateChannel;
	app: IApp;
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

export type TApplicationActions = TActionActiveUsers & TActionSelectedUsers & TActionApp & TActionCreateChannel;
