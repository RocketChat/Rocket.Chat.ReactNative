import { createContext } from 'react';

import { TMicOrSend } from './interfaces';

type TMessageComposerContext = {
	rid: string;
	tmid?: string;
	// TODO: Refactor to "origin"? ShareView | RoomView?
	sharing: boolean;
	micOrSend: TMicOrSend;
	setMicOrSend(type: TMicOrSend): void;
	sendMessage(): void;
};

export const MessageComposerContext = createContext<TMessageComposerContext>({
	rid: '',
	micOrSend: 'mic',
	sharing: false,
	setMicOrSend: () => {},
	sendMessage: () => {}
});
