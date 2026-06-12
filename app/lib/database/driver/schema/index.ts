import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export {
	customEmojisTable,
	frequentlyUsedEmojisTable,
	messagesTable,
	permissionsTable,
	rolesTable,
	roomsTable,
	settingsTable,
	slashCommandsTable,
	subscriptionsTable,
	threadMessagesTable,
	threadsTable,
	uploadsTable,
	usersAppTable
} from './app';
export { serversHistoryTable, serversTable, usersServersTable } from './servers';

// ---- app (per-server) database row types ----

import {
	customEmojisTable,
	frequentlyUsedEmojisTable,
	messagesTable,
	permissionsTable,
	rolesTable,
	roomsTable,
	settingsTable,
	slashCommandsTable,
	subscriptionsTable,
	threadMessagesTable,
	threadsTable,
	uploadsTable,
	usersAppTable
} from './app';
import { serversHistoryTable, serversTable, usersServersTable } from './servers';

export type TSubscriptionRow = InferSelectModel<typeof subscriptionsTable>;
export type TSubscriptionInsert = InferInsertModel<typeof subscriptionsTable>;

export type TRoomRow = InferSelectModel<typeof roomsTable>;
export type TRoomInsert = InferInsertModel<typeof roomsTable>;

export type TMessageRow = InferSelectModel<typeof messagesTable>;
export type TMessageInsert = InferInsertModel<typeof messagesTable>;

export type TThreadRow = InferSelectModel<typeof threadsTable>;
export type TThreadInsert = InferInsertModel<typeof threadsTable>;

export type TThreadMessageRow = InferSelectModel<typeof threadMessagesTable>;
export type TThreadMessageInsert = InferInsertModel<typeof threadMessagesTable>;

export type TCustomEmojiRow = InferSelectModel<typeof customEmojisTable>;
export type TCustomEmojiInsert = InferInsertModel<typeof customEmojisTable>;

export type TFrequentlyUsedEmojiRow = InferSelectModel<typeof frequentlyUsedEmojisTable>;
export type TFrequentlyUsedEmojiInsert = InferInsertModel<typeof frequentlyUsedEmojisTable>;

export type TUploadRow = InferSelectModel<typeof uploadsTable>;
export type TUploadInsert = InferInsertModel<typeof uploadsTable>;

export type TSettingRow = InferSelectModel<typeof settingsTable>;
export type TSettingInsert = InferInsertModel<typeof settingsTable>;

export type TRoleRow = InferSelectModel<typeof rolesTable>;
export type TRoleInsert = InferInsertModel<typeof rolesTable>;

export type TPermissionRow = InferSelectModel<typeof permissionsTable>;
export type TPermissionInsert = InferInsertModel<typeof permissionsTable>;

export type TSlashCommandRow = InferSelectModel<typeof slashCommandsTable>;
export type TSlashCommandInsert = InferInsertModel<typeof slashCommandsTable>;

export type TUserAppRow = InferSelectModel<typeof usersAppTable>;
export type TUserAppInsert = InferInsertModel<typeof usersAppTable>;

// ---- servers (default) database row types ----

export type TUserServerRow = InferSelectModel<typeof usersServersTable>;
export type TUserServerInsert = InferInsertModel<typeof usersServersTable>;

export type TServerRow = InferSelectModel<typeof serversTable>;
export type TServerInsert = InferInsertModel<typeof serversTable>;

export type TServerHistoryRow = InferSelectModel<typeof serversHistoryTable>;
export type TServerHistoryInsert = InferInsertModel<typeof serversHistoryTable>;
