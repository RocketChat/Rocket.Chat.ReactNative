import type { InferSelectModel } from 'drizzle-orm';

import type {
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
import type { serversHistoryTable, serversTable, usersServersTable } from './servers';

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

export type TSubscriptionRow = InferSelectModel<typeof subscriptionsTable>;

export type TRoomRow = InferSelectModel<typeof roomsTable>;

export type TMessageRow = InferSelectModel<typeof messagesTable>;

export type TThreadRow = InferSelectModel<typeof threadsTable>;

export type TThreadMessageRow = InferSelectModel<typeof threadMessagesTable>;

export type TCustomEmojiRow = InferSelectModel<typeof customEmojisTable>;

export type TFrequentlyUsedEmojiRow = InferSelectModel<typeof frequentlyUsedEmojisTable>;

export type TUploadRow = InferSelectModel<typeof uploadsTable>;

export type TSettingRow = InferSelectModel<typeof settingsTable>;

export type TRoleRow = InferSelectModel<typeof rolesTable>;

export type TPermissionRow = InferSelectModel<typeof permissionsTable>;

export type TSlashCommandRow = InferSelectModel<typeof slashCommandsTable>;

export type TUserAppRow = InferSelectModel<typeof usersAppTable>;

// ---- servers (default) database row types ----

export type TUserServerRow = InferSelectModel<typeof usersServersTable>;

export type TServerRow = InferSelectModel<typeof serversTable>;

export type TServerHistoryRow = InferSelectModel<typeof serversHistoryTable>;
