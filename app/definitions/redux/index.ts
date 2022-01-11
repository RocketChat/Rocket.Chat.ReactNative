import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionApp } from '../../actions/app';
import { TActionCreateChannel } from '../../actions/createChannel';
import { TActionEncryption } from '../../actions/encryption';
import { TActionSelectedUsers } from '../../actions/selectedUsers';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IApp } from '../../reducers/app';
import { IConnect } from '../../reducers/connect';
import { ICreateChannel } from '../../reducers/createChannel';
import { IEncryption } from '../../reducers/encryption';
import { ISelectedUsers } from '../../reducers/selectedUsers';

export interface IApplicationState {
	activeUsers: IActiveUsers;
	app: IApp;
	createChannel: ICreateChannel;
	createDiscussion: any;
	customEmojis: any;
	encryption: IEncryption;
	enterpriseModules: any;
	inquiry: any;
	inviteLinks: any;
	login: any;
	meteor: IConnect;
	permissions: any;
	roles: any;
	room: any;
	rooms: any;
	selectedUsers: ISelectedUsers;
	server: any;
	settings: any;
	share: any;
	sortPreferences: any;
	usersTyping: any;
}

export type TApplicationActions = TActionActiveUsers &
	TActionSelectedUsers &
	TActionApp &
	TActionCreateChannel &
	TActionEncryption;
