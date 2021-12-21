import { SetActiveUsers } from '../../actions/activeUsers';
import { ActiveUsers } from '../../reducers/activeUsers';

export interface ApplicationState {
	settings: any;
	login: any;
	meteor: any;
	server: any;
	selectedUsers: any;
	createChannel: any;
	app: any;
	room: any;
	rooms: any;
	sortPreferences: any;
	share: any;
	customEmojis: any;
	activeUsers: ActiveUsers;
	usersTyping: any;
	inviteLinks: any;
	createDiscussion: any;
	inquiry: any;
	enterpriseModules: any;
	encryption: any;
	permissions: any;
	roles: any;
}

export type ApplicationActions = SetActiveUsers;
