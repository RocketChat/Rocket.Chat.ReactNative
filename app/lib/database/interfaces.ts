import { type Database, type Collection } from '@nozbe/watermelondb';

import type { AUDIO_WAVEFORMS_TABLE } from './model/AudioWaveform';
import type { CUSTOM_EMOJIS_TABLE } from './model/CustomEmoji';
import type { FREQUENTLY_USED_EMOJIS_TABLE } from './model/FrequentlyUsedEmoji';
import type { MESSAGES_TABLE } from './model/Message';
import type { PERMISSIONS_TABLE } from './model/Permission';
import type { ROLES_TABLE } from './model/Role';
import type { ROOMS_TABLE } from './model/Room';
import type { SERVERS_HISTORY_TABLE } from './model/ServersHistory';
import type { SETTINGS_TABLE } from './model/Setting';
import type { SLASH_COMMANDS_TABLE } from './model/SlashCommand';
import type { SUBSCRIPTIONS_TABLE } from './model/Subscription';
import type { THREADS_TABLE } from './model/Thread';
import type { THREAD_MESSAGES_TABLE } from './model/ThreadMessage';
import type { UPLOADS_TABLE } from './model/Upload';
import type { USERS_TABLE } from './model/User';
import type { SERVERS_TABLE } from './model/servers/Server';
import type { LOGGED_USERS_TABLE } from './model/servers/User';
import type { TAudioWaveformModel } from '~/definitions/IAudioWaveform';
import type { TCustomEmojiModel, TFrequentlyUsedEmojiModel } from '~/definitions/IEmoji';
import type { TLoggedUserModel } from '~/definitions/ILoggedUser';
import type { TMessageModel } from '~/definitions/IMessage';
import type { TPermissionModel } from '~/definitions/IPermission';
import type { TRoleModel } from '~/definitions/IRole';
import type { TRoomModel } from '~/definitions/IRoom';
import type { TServerModel } from '~/definitions/IServer';
import type { TServerHistoryModel } from '~/definitions/IServerHistory';
import type { TSettingsModel } from '~/definitions/ISettings';
import type { TSlashCommandModel } from '~/definitions/ISlashCommand';
import type { TSubscriptionModel } from '~/definitions/ISubscription';
import type { TThreadModel } from '~/definitions/IThread';
import type { TThreadMessageModel } from '~/definitions/IThreadMessage';
import type { TUploadModel } from '~/definitions/IUpload';
import type { TUserModel } from '~/definitions/IUser';

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
	| typeof USERS_TABLE
	| typeof AUDIO_WAVEFORMS_TABLE;

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
													: T extends typeof AUDIO_WAVEFORMS_TABLE
														? TAudioWaveformModel
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
