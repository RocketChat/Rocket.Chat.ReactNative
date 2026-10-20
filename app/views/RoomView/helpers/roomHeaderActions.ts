const ROOM_HEADER_ACTION_PRIORITY = ['encryption', 'threads', 'call', 'notifications'] as const;
export type TRoomHeaderActionKey = (typeof ROOM_HEADER_ACTION_PRIORITY)[number];
export const ROOM_HEADER_ACTION_DISPLAY_ORDER: TRoomHeaderActionKey[] = ['encryption', 'notifications', 'call', 'threads'];
const MAX_VISIBLE_ROOM_HEADER_ACTIONS = 2;

export const splitRoomHeaderActions = (
	present: Partial<Record<TRoomHeaderActionKey, boolean>>
): { visibleKeys: TRoomHeaderActionKey[]; overflowKeys: TRoomHeaderActionKey[] } => {
	const presentKeys = ROOM_HEADER_ACTION_PRIORITY.filter(key => present[key]);
	const keptKeys = presentKeys.slice(0, MAX_VISIBLE_ROOM_HEADER_ACTIONS);
	return {
		visibleKeys: ROOM_HEADER_ACTION_DISPLAY_ORDER.filter(key => keptKeys.includes(key)),
		overflowKeys: presentKeys.slice(MAX_VISIBLE_ROOM_HEADER_ACTIONS)
	};
};
