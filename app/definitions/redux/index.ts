// ACTIONS
import { type TActionInquiry } from '../../ee/omnichannel/actions/inquiry';
import { type TActionActiveUsers } from '../../actions/activeUsers';
import { type TActionApp } from '../../actions/app';
import { type TActionCreateChannel } from '../../actions/createChannel';
import { type TActionCreateDiscussion } from '../../actions/createDiscussion';
import { type TActionCustomEmojis } from '../../actions/customEmojis';
import { type TActionEncryption } from '../../actions/encryption';
import { type TActionInviteLinks } from '../../actions/inviteLinks';
import { type IActionRoles } from '../../actions/roles';
import { type TActionSelectedUsers } from '../../actions/selectedUsers';
import { type TActionServer } from '../../actions/server';
import { type IActionSettings } from '../../actions/settings';
import { type TActionsShare } from '../../actions/share';
import { type TActionSortPreferences } from '../../actions/sortPreferences';
import { type TActionUserTyping } from '../../actions/usersTyping';
import { type TActionPermissions } from '../../actions/permissions';
import { type TActionEnterpriseModules } from '../../actions/enterpriseModules';
import { type TActionVideoConf } from '../../actions/videoConf';
import { type TActionSupportedVersions } from '../../actions/supportedVersions';
import { type TInAppFeedbackAction } from '../../actions/inAppFeedback';
// REDUCERS
import { type IActiveUsers } from '../../reducers/activeUsers';
import { type IApp } from '../../reducers/app';
import { type IConnect } from '../../reducers/connect';
import { type ICreateChannel } from '../../reducers/createChannel';
import { type ICreateDiscussion } from '../../reducers/createDiscussion';
import { type IEncryption } from '../../reducers/encryption';
import { type IInviteLinks } from '../../reducers/inviteLinks';
import { type ILogin } from '../../reducers/login';
import { type IRoles } from '../../reducers/roles';
import { type IRoom } from '../../reducers/room';
import { type ISelectedUsers } from '../../reducers/selectedUsers';
import { type IServer } from '../../reducers/server';
import { type TSettingsState } from '../../reducers/settings';
import { type IShare } from '../../reducers/share';
import { type IInquiry } from '../../ee/omnichannel/reducers/inquiry';
import { type IPermissionsState } from '../../reducers/permissions';
import { type IEnterpriseModules } from '../../reducers/enterpriseModules';
import { type IVideoConf } from '../../reducers/videoConf';
import { type TActionUsersRoles } from '../../actions/usersRoles';
import { type TUsersRoles } from '../../reducers/usersRoles';
import { type ITroubleshootingNotification } from '../../reducers/troubleshootingNotification';
import { type TActionTroubleshootingNotification } from '../../actions/troubleshootingNotification';
import { type ISupportedVersionsState } from '../../reducers/supportedVersions';
import { type IInAppFeedbackState } from '../../reducers/inAppFeedback';
import { type IRooms } from '../../reducers/rooms';
import { type IPreferences } from '../IPreferences';
import { type ICustomEmojis } from '../IEmoji';
import { type IUsersTyping } from '../../reducers/usersTyping';

export interface IApplicationState {
	settings: TSettingsState;
	login: ILogin;
	meteor: IConnect;
	server: IServer;
	selectedUsers: ISelectedUsers;
	app: IApp;
	createChannel: ICreateChannel;
	room: IRoom;
	rooms: IRooms;
	sortPreferences: IPreferences;
	share: IShare;
	customEmojis: ICustomEmojis;
	activeUsers: IActiveUsers;
	usersTyping: IUsersTyping;
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
