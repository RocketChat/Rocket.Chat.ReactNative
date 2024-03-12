// ACTIONS
import { TActionInquiry } from '../../ee/omnichannel/actions/inquiry';
import { TActionActiveUsers } from '../../actions/activeUsers';
import { TActionApp } from '../../actions/app';
import { TActionCreateChannel } from '../../actions/createChannel';
import { TActionCreateDiscussion } from '../../actions/createDiscussion';
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
import { TActionPermissions } from '../../actions/permissions';
import { TActionEnterpriseModules } from '../../actions/enterpriseModules';
import { TActionVideoConf } from '../../actions/videoConf';
import { TActionSupportedVersions } from '../../actions/supportedVersions';
import { TInAppFeedbackAction } from '../../actions/inAppFeedback';
// REDUCERS
import { IActiveUsers } from '../../reducers/activeUsers';
import { IApp } from '../../reducers/app';
import { IConnect } from '../../reducers/connect';
import { ICreateChannel } from '../../reducers/createChannel';
import { ICreateDiscussion } from '../../reducers/createDiscussion';
import { IEncryption } from '../../reducers/encryption';
import { IInviteLinks } from '../../reducers/inviteLinks';
import { ILogin } from '../../reducers/login';
import { IRoles } from '../../reducers/roles';
import { IRoom } from '../../reducers/room';
import { ISelectedUsers } from '../../reducers/selectedUsers';
import { IServer } from '../../reducers/server';
import { TSettingsState } from '../../reducers/settings';
import { IShare } from '../../reducers/share';
import { IInquiry } from '../../ee/omnichannel/reducers/inquiry';
import { IPermissionsState } from '../../reducers/permissions';
import { IEnterpriseModules } from '../../reducers/enterpriseModules';
import { IVideoConf } from '../../reducers/videoConf';
import { TActionUsersRoles } from '../../actions/usersRoles';
import { TUsersRoles } from '../../reducers/usersRoles';
import { ITroubleshootingNotification } from '../../reducers/troubleshootingNotification';
import { TActionTroubleshootingNotification } from '../../actions/troubleshootingNotification';
import { ISupportedVersionsState } from '../../reducers/supportedVersions';
import { IInAppFeedbackState } from '../../reducers/inAppFeedback';

export interface IApplicationState {
	settings: TSettingsState;
	login: ILogin;
	meteor: IConnect;
	server: IServer;
	selectedUsers: ISelectedUsers;
	app: IApp;
	createChannel: ICreateChannel;
	room: IRoom;
	rooms: any;
	sortPreferences: any;
	share: IShare;
	customEmojis: any;
	activeUsers: IActiveUsers;
	usersTyping: any;
	inviteLinks: IInviteLinks;
	createDiscussion: ICreateDiscussion;
	inquiry: IInquiry;
	enterpriseModules: IEnterpriseModules;
	encryption: IEncryption;
	permissions: IPermissionsState;
	roles: IRoles;
	videoConf: IVideoConf;
	usersRoles: TUsersRoles;
	troubleshootingNotification: ITroubleshootingNotification;
	supportedVersions: ISupportedVersionsState;
	inAppFeedback: IInAppFeedbackState;
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
	TActionCreateDiscussion &
	TActionCreateChannel &
	TActionsShare &
	TActionServer &
	TActionApp &
	TActionInquiry &
	TActionPermissions &
	TActionEnterpriseModules &
	TActionVideoConf &
	TActionUsersRoles &
	TActionTroubleshootingNotification &
	TActionSupportedVersions &
	TInAppFeedbackAction;
