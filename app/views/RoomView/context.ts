import { createContext, useContext } from 'react';

interface IRoomContext {
	selectedMessages: string[];
}

export const RoomContext = createContext<IRoomContext>({
	selectedMessages: []
});

export const useRoomContext = () => useContext(RoomContext);
