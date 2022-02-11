import { BannersEndpoints } from './banners';
import { ChannelsEndpoints } from './channels';
import { ChatEndpoints } from './chat';
import { CloudEndpoints } from './cloud';
import { CustomUserStatusEndpoints } from './customUserStatus';
import { DmEndpoints } from './dm';
import { DnsEndpoints } from './dns';
import { EmojiCustomEndpoints } from './emojiCustom';
import { GroupsEndpoints } from './groups';
import { ImEndpoints } from './im';
import { InstancesEndpoints } from './instances';
import { InvitesEndpoints } from './invites';
import { MiscEndpoints } from './misc';
import { OmnichannelEndpoints } from './omnichannel';
import { PermissionsEndpoints } from './permissions';
import { RolesEndpoints } from './roles';
import { RoomsEndpoints } from './rooms';
import { OauthCustomConfiguration } from './settings';
import { StatisticsEndpoints } from './statistics';
import { User } from './user';
import { UsersEndpoints } from './users';

export type Endpoints = BannersEndpoints &
	ChannelsEndpoints &
	ChatEndpoints &
	CloudEndpoints &
	CustomUserStatusEndpoints &
	DmEndpoints &
	DnsEndpoints &
	EmojiCustomEndpoints &
	GroupsEndpoints &
	ImEndpoints &
	InstancesEndpoints &
	InvitesEndpoints &
	MiscEndpoints &
	OmnichannelEndpoints &
	PermissionsEndpoints &
	RolesEndpoints &
	RoomsEndpoints &
	OauthCustomConfiguration &
	StatisticsEndpoints &
	User &
	UsersEndpoints;
