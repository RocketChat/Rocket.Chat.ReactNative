import { ChannelsEndpoints } from './channels';
import { ChatEndpoints } from './chat';
import { CustomUserStatusEndpoints } from './customUserStatus';
import { DmEndpoints } from './dm';
import { EmojiCustomEndpoints } from './emojiCustom';
import { GroupsEndpoints } from './groups';
import { ImEndpoints } from './im';
import { InvitesEndpoints } from './invites';
import { OmnichannelEndpoints } from './omnichannel';
import { PermissionsEndpoints } from './permissions';
import { RolesEndpoints } from './roles';
import { RoomsEndpoints } from './rooms';
import { OauthCustomConfiguration } from './settings';
import { UserEndpoints } from './user';
import { UsersEndpoints } from './users';
import { TeamsEndpoints } from './teams';

export type Endpoints = ChannelsEndpoints &
	ChatEndpoints &
	CustomUserStatusEndpoints &
	DmEndpoints &
	EmojiCustomEndpoints &
	GroupsEndpoints &
	ImEndpoints &
	InvitesEndpoints &
	OmnichannelEndpoints &
	PermissionsEndpoints &
	RolesEndpoints &
	RoomsEndpoints &
	OauthCustomConfiguration &
	UserEndpoints &
	UsersEndpoints &
	TeamsEndpoints;
