import { type ChannelsEndpoints } from './channels';
import { type ChatEndpoints } from './chat';
import { type CustomUserStatusEndpoints } from './customUserStatus';
import { type DmEndpoints } from './dm';
import { type EmojiCustomEndpoints } from './emojiCustom';
import { type GroupsEndpoints } from './groups';
import { type ImEndpoints } from './im';
import { type InvitesEndpoints } from './invites';
import { type OmnichannelEndpoints } from './omnichannel';
import { type PermissionsEndpoints } from './permissions';
import { type RolesEndpoints } from './roles';
import { type RoomsEndpoints } from './rooms';
import { type OauthCustomConfiguration } from './settings';
import { type UsersEndpoints } from './users';
import { type TeamsEndpoints } from './teams';
import { type E2eEndpoints } from './e2e';
import { type SubscriptionsEndpoints } from './subscriptions';
import { type VideoConferenceEndpoints } from './videoConference';
import { type CommandsEndpoints } from './commands';
import { type PushEndpoints } from './push';
import { type DirectoryEndpoint } from './directory';
import { type AutoTranslateEndpoints } from './autotranslate';
import { type ModerationEndpoints } from './moderation';
import { type QrCodeScannerEndpoints } from './QrScanner';

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
	ModerationEndpoints &
	QrCodeScannerEndpoints;
