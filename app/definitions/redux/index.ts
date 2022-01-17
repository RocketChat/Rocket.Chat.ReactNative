import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionInviteLinks } from '../../actions/inviteLinks';
import { TActionSelectedUsers } from '../../actions/selectedUsers';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IInviteLinks } from '../../reducers/inviteLinks';
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
	inviteLinks: IInviteLinks;
	createDiscussion: any;
	inquiry: any;
	enterpriseModules: any;
	encryption: any;
	permissions: any;
	roles: any;
}

export type TApplicationActions = TActionActiveUsers & TActionSelectedUsers & TActionInviteLinks;
