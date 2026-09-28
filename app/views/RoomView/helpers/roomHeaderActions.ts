export const ROOM_HEADER_ACTION_PRIORITY = ['threads', 'call', 'encryption', 'notifications'] as const;
export type TRoomHeaderActionKey = (typeof ROOM_HEADER_ACTION_PRIORITY)[number];
export const MAX_VISIBLE_ROOM_HEADER_ACTIONS = 2;

export const splitRoomHeaderActions = (
	present: Partial<Record<TRoomHeaderActionKey, boolean>>
): { visibleKeys: TRoomHeaderActionKey[]; overflowKeys: TRoomHeaderActionKey[] } => {
	const presentKeys = ROOM_HEADER_ACTION_PRIORITY.filter(key => present[key]);
	return {
		visibleKeys: presentKeys.slice(0, MAX_VISIBLE_ROOM_HEADER_ACTIONS),
		overflowKeys: presentKeys.slice(MAX_VISIBLE_ROOM_HEADER_ACTIONS)
	};
};
