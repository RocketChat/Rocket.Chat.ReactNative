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
import { UsersEndpoints } from './users';
import { TeamsEndpoints } from './teams';
import { E2eEndpoints } from './e2e';
import { SubscriptionsEndpoints } from './subscriptions';
import { VideoConferenceEndpoints } from './videoConference';
import { CommandsEndpoints } from './commands';
import { PushEndpoints } from './push';
import { DirectoryEndpoint } from './directory';
import { AutoTranslateEndpoints } from './autotranslate';
import { ModerationEndpoints } from './moderation';

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
	UsersEndpoints &
	TeamsEndpoints &
	E2eEndpoints &
	SubscriptionsEndpoints &
	VideoConferenceEndpoints &
	CommandsEndpoints &
	PushEndpoints &
	DirectoryEndpoint &
	AutoTranslateEndpoints &
	ModerationEndpoints;
