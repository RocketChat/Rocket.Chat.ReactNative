import { Database, Collection } from '@nozbe/watermelondb';

import {
	CUSTOM_EMOJIS_TABLE,
	FREQUENTLY_USED_EMOJIS_TABLE,
	MESSAGES_TABLE,
	PERMISSIONS_TABLE,
	ROLES_TABLE,
	ROOMS_TABLE,
	SETTINGS_TABLE,
	SLASH_COMMANDS_TABLE,
	SUBSCRIPTIONS_TABLE,
	THREADS_TABLE,
	THREAD_MESSAGES_TABLE,
	UPLOADS_TABLE,
	USERS_TABLE,
	SERVERS_HISTORY_TABLE,
	SERVERS_TABLE,
	LOGGED_USERS_TABLE
} from './model';
import {
	TSubscriptionModel,
	TRoomModel,
	TMessageModel,
	TThreadModel,
	TThreadMessageModel,
	TCustomEmojiModel,
	TFrequentlyUsedEmojiModel,
	TUploadModel,
	TSettingsModel,
	TRoleModel,
	TPermissionModel,
	TSlashCommandModel,
	TUserModel,
	TServerModel,
	TLoggedUserModel,
	TServerHistoryModel
} from '../../definitions';

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
