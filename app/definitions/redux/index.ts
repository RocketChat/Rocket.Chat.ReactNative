import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionSelectedUsers } from '../../actions/selectedUsers';
import { TActionCustomEmojis } from '../../actions/customEmojis';
import { TActionEncryption } from '../../actions/encryption';
import { TActionInviteLinks } from '../../actions/inviteLinks';
import { IActionRoles } from '../../actions/roles';
import { IActionSettings } from '../../actions/settings';
import { TActionSortPreferences } from '../../actions/sortPreferences';
import { TActionUserTyping } from '../../actions/usersTyping';
import { TActionsShare } from '../../actions/share';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IEncryption } from '../../reducers/encryption';
import { IInviteLinks } from '../../reducers/inviteLinks';
import { IRoles } from '../../reducers/roles';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { IShare } from '../../reducers/share';
import { IConnect } from '../../reducers/connect';
import { ISettings } from '../../reducers/settings';

export interface IApplicationState {
	settings: ISettings;
	login: any;
	meteor: IConnect;
	server: any;
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
	TActionsShare;
