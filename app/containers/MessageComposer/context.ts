import { createContext } from 'react';

import { TMicOrSend } from './interfaces';

type TMessageComposerContext = {
	micOrSend: TMicOrSend;
	setMicOrSend(type: TMicOrSend): void;
	sendMessage(): void;
};

export const MessageComposerContext = createContext<TMessageComposerContext>({
	micOrSend: 'mic',
	setMicOrSend: () => {},
	sendMessage: () => {}
});
