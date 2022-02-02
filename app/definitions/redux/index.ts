// ACTIONS
import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionCustomEmojis } from '../../actions/customEmojis';
import { TActionEncryption } from '../../actions/encryption';
import { TActionInviteLinks } from '../../actions/inviteLinks';
import { IActionRoles } from '../../actions/roles';
import { TActionSelectedUsers } from '../../actions/selectedUsers';
import { TActionServer } from '../../actions/server';
import { IActionSettings } from '../../actions/settings';
import { TActionsShare } from '../../actions/share';
import { TActionSortPreferences } from '../../actions/sortPreferences';
import { TActionUserTyping } from '../../actions/usersTyping';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IConnect } from '../../reducers/connect';
import { IEncryption } from '../../reducers/encryption';
import { IInviteLinks } from '../../reducers/inviteLinks';
import { IRoles } from '../../reducers/roles';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { IServer } from '../../reducers/server';
import { ISettings } from '../../reducers/settings';
import { IShare } from '../../reducers/share';

export interface IApplicationState {
	settings: ISettings;
	login: any;
	meteor: IConnect;
	server: IServer;
	selectedUsers: ISelectedUsers;
	createChannel: any;
	app: any;
	room: any;
	rooms: any;
	sortPreferences: any;
	share: IShare;
	customEmojis: any;
	activeUsers: IActiveUsers;
	usersTyping: any;
	inviteLinks: IInviteLinks;
	createDiscussion: any;
	inquiry: any;
	enterpriseModules: any;
	encryption: IEncryption;
	permissions: any;
	roles: IRoles;
}

export type TApplicationActions = TActionActiveUsers &
	TActionSelectedUsers &
	TActionCustomEmojis &
	TActionInviteLinks &
	IActionRoles &
	IActionSettings &
	TActionEncryption &
	TActionSortPreferences &
	TActionUserTyping &
	TActionsShare &
	TActionServer;
