import { createContext, useContext } from 'react';

import { type IRoomScreenContextValue } from '../definitions';

export const RoomScreenContext = createContext<IRoomScreenContextValue | null>(null);

export const useRoomScreen = (): IRoomScreenContextValue => {
	const value = useContext(RoomScreenContext);
	if (!value) {
		throw new Error('Room screen hooks must be used within a RoomScreenContext.Provider');
	}
	return value;
};
