import { createContext, useContext } from 'react';

import { type ILastSeenContextValue } from '../definitions';

// `lastSeen` (the unread divider anchor) is per-screen, not per-room: room and thread mount two
// RoomViews on one rid-keyed store, so a thread's send must not erase the room screen's divider.
// This context is RoomView-local — it carries the screen's own value to its own subtree.
export const LastSeenContext = createContext<ILastSeenContextValue>({ lastSeen: null, clearLastSeen: () => {} });

export const useLastSeen = (): ILastSeenContextValue => useContext(LastSeenContext);
