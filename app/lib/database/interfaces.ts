import { Database, Collection } from '@nozbe/watermelondb';

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

export type TAppDatabaseNames =
	| 'subscriptions'
	| 'rooms'
	| 'messages'
	| 'threads'
	| 'thread_messages'
	| 'custom_emojis'
	| 'frequently_used_emojis'
	| 'uploads'
	| 'settings'
	| 'roles'
	| 'permissions'
	| 'slash_commands'
	| 'users';

// Verify if T extends one type from TAppDatabaseNames, and if is truly,
// returns the specific model type.
type ObjectType<T> = T extends 'subscriptions'
	? TSubscriptionModel
	: T extends 'rooms'
	? TRoomModel
	: T extends 'messages'
	? TMessageModel
	: T extends 'threads'
	? TThreadModel
	: T extends 'thread_messages'
	? TThreadMessageModel
	: T extends 'custom_emojis'
	? TCustomEmojiModel
	: T extends 'frequently_used_emojis'
	? TFrequentlyUsedEmojiModel
	: T extends 'uploads'
	? TUploadModel
	: T extends 'settings'
	? TSettingsModel
	: T extends 'roles'
	? TRoleModel
	: T extends 'permissions'
	? TPermissionModel
	: T extends 'slash_commands'
	? TSlashCommandModel
	: T extends 'users'
	? TUserModel
	: never;

export type TAppDatabase = {
	get: <T extends TAppDatabaseNames>(db: T) => Collection<ObjectType<T>>;
} & Database;
