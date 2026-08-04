import { useRoomStore } from '../stores/RoomStoreContext';

// The room model mutates in place (same ref per emit), and the React Compiler caches derived
// values on that stable ref. Deriving the boolean inside the selector keeps it fresh per emit
// and only re-renders the caller when the derived value actually changes.
export const useIsIgnored = (authorId?: string): boolean => {
	return useRoomStore(s => (authorId && 'id' in s.room ? (s.room.ignored?.includes(authorId) ?? false) : false));
};
