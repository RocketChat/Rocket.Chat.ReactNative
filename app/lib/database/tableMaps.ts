/**
 * Maps each WatermelonDB table name to its Drizzle table object and its Model subclass.
 *
 * The facade Database uses these to (a) resolve the Drizzle table for a query and
 * (b) instantiate the correct Model subclass so its @field/@date/@json accessors exist —
 * the role WMDB's `modelClasses` array played.
 */

import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

import type { ModelClass } from './facade/Database';
import {
	subscriptionsTable,
	roomsTable,
	messagesTable,
	threadsTable,
	threadMessagesTable,
	customEmojisTable,
	frequentlyUsedEmojisTable,
	uploadsTable,
	settingsTable,
	rolesTable,
	permissionsTable,
	slashCommandsTable,
	usersAppTable,
	serversTable,
	usersServersTable,
	serversHistoryTable
} from './driver/schema';
import {
	SUBSCRIPTIONS_TABLE,
	ROOMS_TABLE,
	MESSAGES_TABLE,
	THREADS_TABLE,
	THREAD_MESSAGES_TABLE,
	CUSTOM_EMOJIS_TABLE,
	FREQUENTLY_USED_EMOJIS_TABLE,
	UPLOADS_TABLE,
	SETTINGS_TABLE,
	ROLES_TABLE,
	PERMISSIONS_TABLE,
	SLASH_COMMANDS_TABLE,
	USERS_TABLE,
	SERVERS_TABLE,
	LOGGED_USERS_TABLE,
	SERVERS_HISTORY_TABLE
} from './model';
import Subscription from './model/Subscription';
import Room from './model/Room';
import Message from './model/Message';
import Thread from './model/Thread';
import ThreadMessage from './model/ThreadMessage';
import CustomEmoji from './model/CustomEmoji';
import FrequentlyUsedEmoji from './model/FrequentlyUsedEmoji';
import Upload from './model/Upload';
import Setting from './model/Setting';
import Role from './model/Role';
import Permission from './model/Permission';
import SlashCommand from './model/SlashCommand';
import User from './model/User';
import Server from './model/servers/Server';
import LoggedUser from './model/servers/User';
import ServersHistory from './model/ServersHistory';

export const appTableMap: Record<string, SQLiteTable> = {
	[SUBSCRIPTIONS_TABLE]: subscriptionsTable,
	[ROOMS_TABLE]: roomsTable,
	[MESSAGES_TABLE]: messagesTable,
	[THREADS_TABLE]: threadsTable,
	[THREAD_MESSAGES_TABLE]: threadMessagesTable,
	[CUSTOM_EMOJIS_TABLE]: customEmojisTable,
	[FREQUENTLY_USED_EMOJIS_TABLE]: frequentlyUsedEmojisTable,
	[UPLOADS_TABLE]: uploadsTable,
	[SETTINGS_TABLE]: settingsTable,
	[ROLES_TABLE]: rolesTable,
	[PERMISSIONS_TABLE]: permissionsTable,
	[SLASH_COMMANDS_TABLE]: slashCommandsTable,
	[USERS_TABLE]: usersAppTable
};

export const appModelMap: Record<string, ModelClass> = {
	[SUBSCRIPTIONS_TABLE]: Subscription,
	[ROOMS_TABLE]: Room,
	[MESSAGES_TABLE]: Message,
	[THREADS_TABLE]: Thread,
	[THREAD_MESSAGES_TABLE]: ThreadMessage,
	[CUSTOM_EMOJIS_TABLE]: CustomEmoji,
	[FREQUENTLY_USED_EMOJIS_TABLE]: FrequentlyUsedEmoji,
	[UPLOADS_TABLE]: Upload,
	[SETTINGS_TABLE]: Setting,
	[ROLES_TABLE]: Role,
	[PERMISSIONS_TABLE]: Permission,
	[SLASH_COMMANDS_TABLE]: SlashCommand,
	[USERS_TABLE]: User
};

export const serversTableMap: Record<string, SQLiteTable> = {
	[SERVERS_TABLE]: serversTable,
	[LOGGED_USERS_TABLE]: usersServersTable,
	[SERVERS_HISTORY_TABLE]: serversHistoryTable
};

export const serversModelMap: Record<string, ModelClass> = {
	[SERVERS_TABLE]: Server,
	[LOGGED_USERS_TABLE]: LoggedUser,
	[SERVERS_HISTORY_TABLE]: ServersHistory
};
