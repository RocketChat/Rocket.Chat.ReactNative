import { Database, Collection } from '@nozbe/watermelondb';

import { CUSTOM_EMOJIS_TABLE } from './model/CustomEmoji';
import { FREQUENTLY_USED_EMOJIS_TABLE } from './model/FrequentlyUsedEmoji';
import { MESSAGES_TABLE } from './model/Message';
import { PERMISSIONS_TABLE } from './model/Permission';
import { ROLES_TABLE } from './model/Role';
import { ROOMS_TABLE } from './model/Room';
import { SETTINGS_TABLE } from './model/Setting';
import { SLASH_COMMANDS_TABLE } from './model/SlashCommand';
import { SUBSCRIPTIONS_TABLE } from './model/Subscription';
import { THREADS_TABLE } from './model/Thread';
import { THREAD_MESSAGES_TABLE } from './model/ThreadMessage';
import { UPLOADS_TABLE } from './model/Upload';
import { USERS_TABLE } from './model/User';
import { SERVERS_HISTORY_TABLE } from './model/ServersHistory';
import { SERVERS_TABLE } from './model/servers/Server';
import { LOGGED_USERS_TABLE } from './model/servers/User';
import { TSubscriptionModel } from '../../definitions/ISubscription';
import { TRoomModel } from '../../definitions/IRoom';
import { TMessageModel } from '../../definitions/IMessage';
import { TThreadModel } from '../../definitions/IThread';
import { TThreadMessageModel } from '../../definitions/IThreadMessage';
import { TCustomEmojiModel } from '../../definitions/ICustomEmoji';
import { TFrequentlyUsedEmojiModel } from '../../definitions/IFrequentlyUsedEmoji';
import { TUploadModel } from '../../definitions/IUpload';
import { TSettingsModel } from '../../definitions/ISettings';
import { TRoleModel } from '../../definitions/IRole';
import { TPermissionModel } from '../../definitions/IPermission';
import { TSlashCommandModel } from '../../definitions/ISlashCommand';
import { TUserModel } from '../../definitions/IUser';
import { TServerModel } from '../../definitions/IServer';
import { TLoggedUserModel } from '../../definitions/ILoggedUser';
import { TServerHistoryModel } from '../../definitions/IServerHistory';

export type TAppDatabaseNames =
	| typeof SUBSCRIPTIONS_TABLE
	| typeof ROOMS_TABLE
	| typeof MESSAGES_TABLE
	| typeof THREADS_TABLE
	| typeof THREAD_MESSAGES_TABLE
	| typeof CUSTOM_EMOJIS_TABLE
	| typeof FREQUENTLY_USED_EMOJIS_TABLE
	| typeof UPLOADS_TABLE
	| typeof SETTINGS_TABLE
	| typeof ROLES_TABLE
	| typeof PERMISSIONS_TABLE
	| typeof SLASH_COMMANDS_TABLE
	| typeof USERS_TABLE;

// Verify if T extends one type from TAppDatabaseNames, and if is truly,
// returns the specific model type.
// https://stackoverflow.com/a/54166010  TypeScript function return type based on input parameter
type ObjectType<T> = T extends typeof SUBSCRIPTIONS_TABLE
	? TSubscriptionModel
	: T extends typeof ROOMS_TABLE
	? TRoomModel
	: T extends typeof MESSAGES_TABLE
	? TMessageModel
	: T extends typeof THREADS_TABLE
	? TThreadModel
	: T extends typeof THREAD_MESSAGES_TABLE
	? TThreadMessageModel
	: T extends typeof CUSTOM_EMOJIS_TABLE
	? TCustomEmojiModel
	: T extends typeof FREQUENTLY_USED_EMOJIS_TABLE
	? TFrequentlyUsedEmojiModel
	: T extends typeof UPLOADS_TABLE
	? TUploadModel
	: T extends typeof SETTINGS_TABLE
	? TSettingsModel
	: T extends typeof ROLES_TABLE
	? TRoleModel
	: T extends typeof PERMISSIONS_TABLE
	? TPermissionModel
	: T extends typeof SLASH_COMMANDS_TABLE
	? TSlashCommandModel
	: T extends typeof USERS_TABLE
	? TUserModel
	: never;

export type TAppDatabase = {
	get: <T extends TAppDatabaseNames>(db: T) => Collection<ObjectType<T>>;
} & Database;

// Migration to server database
export type TServerDatabaseNames = typeof SERVERS_TABLE | typeof LOGGED_USERS_TABLE | typeof SERVERS_HISTORY_TABLE;

type ObjectServerType<T> = T extends typeof SERVERS_TABLE
	? TServerModel
	: T extends typeof LOGGED_USERS_TABLE
	? TLoggedUserModel
	: T extends typeof SERVERS_HISTORY_TABLE
	? TServerHistoryModel
	: never;

export type TServerDatabase = {
	get: <T extends TServerDatabaseNames>(db: T) => Collection<ObjectServerType<T>>;
} & Database;
