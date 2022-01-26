// ACTIONS
import { TActionServer } from '../../actions/server';
import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionInviteLinks } from '../../actions/inviteLinks';
import { IActionRoles } from '../../actions/roles';
import { TActionSelectedUsers } from '../../actions/selectedUsers';
import { IActionSettings } from '../../actions/settings';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IInviteLinks } from '../../reducers/inviteLinks';
import { IRoles } from '../../reducers/roles';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { IServer } from '../../reducers/server';
import { ISettings } from '../../reducers/settings';

export interface IApplicationState {
	settings: ISettings;
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
	inviteLinks: IInviteLinks;
	createDiscussion: any;
	inquiry: any;
	enterpriseModules: any;
	encryption: any;
	permissions: any;
	roles: IRoles;
}

export type TApplicationActions = TActionActiveUsers &
	TActionSelectedUsers &
	TActionInviteLinks &
	IActionRoles &
	IActionSettings &
	TActionServer;
