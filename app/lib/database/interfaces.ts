import { Database, Collection } from '@nozbe/watermelondb';

import * as models from './model';
import * as definitions from '../../definitions';

export type TAppDatabaseNames =
	| typeof models.SUBSCRIPTIONS_TABLE
	| typeof models.ROOMS_TABLE
	| typeof models.MESSAGES_TABLE
	| typeof models.THREADS_TABLE
	| typeof models.THREAD_MESSAGES_TABLE
	| typeof models.CUSTOM_EMOJIS_TABLE
	| typeof models.FREQUENTLY_USED_EMOJIS_TABLE
	| typeof models.UPLOADS_TABLE
	| typeof models.SETTINGS_TABLE
	| typeof models.ROLES_TABLE
	| typeof models.PERMISSIONS_TABLE
	| typeof models.SLASH_COMMANDS_TABLE
	| typeof models.USERS_TABLE;

// Verify if T extends one type from TAppDatabaseNames, and if is truly,
// returns the specific model type.
// https://stackoverflow.com/a/54166010  TypeScript function return type based on input parameter
type ObjectType<T> = T extends typeof models.SUBSCRIPTIONS_TABLE
	? definitions.TSubscriptionModel
	: T extends typeof models.ROOMS_TABLE
	? definitions.TRoomModel
	: T extends typeof models.MESSAGES_TABLE
	? definitions.TMessageModel
	: T extends typeof models.THREADS_TABLE
	? definitions.TThreadModel
	: T extends typeof models.THREAD_MESSAGES_TABLE
	? definitions.TThreadMessageModel
	: T extends typeof models.CUSTOM_EMOJIS_TABLE
	? definitions.TCustomEmojiModel
	: T extends typeof models.FREQUENTLY_USED_EMOJIS_TABLE
	? definitions.TFrequentlyUsedEmojiModel
	: T extends typeof models.UPLOADS_TABLE
	? definitions.TUploadModel
	: T extends typeof models.SETTINGS_TABLE
	? definitions.TSettingsModel
	: T extends typeof models.ROLES_TABLE
	? definitions.TRoleModel
	: T extends typeof models.PERMISSIONS_TABLE
	? definitions.TPermissionModel
	: T extends typeof models.SLASH_COMMANDS_TABLE
	? definitions.TSlashCommandModel
	: T extends typeof models.USERS_TABLE
	? definitions.TUserModel
	: never;

export type TAppDatabase = {
	get: <T extends TAppDatabaseNames>(db: T) => Collection<ObjectType<T>>;
} & Database;

// Migration to server database
export type TServerDatabaseNames =
	| typeof models.SERVERS_TABLE
	| typeof models.LOGGED_USERS_TABLE
	| typeof models.SERVERS_HISTORY_TABLE;

type ObjectServerType<T> = T extends typeof models.SERVERS_TABLE
	? definitions.TServerModel
	: T extends typeof models.LOGGED_USERS_TABLE
	? definitions.TLoggedUserModel
	: T extends typeof models.SERVERS_HISTORY_TABLE
	? definitions.TServerHistoryModel
	: never;

export type TServerDatabase = {
	get: <T extends TServerDatabaseNames>(db: T) => Collection<ObjectServerType<T>>;
} & Database;
