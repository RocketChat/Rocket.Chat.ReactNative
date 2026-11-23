import mitt from 'mitt';

import { type TMarkdownStyle } from '~/containers/MessageComposer/interfaces';

export type TEmitterEvents = {
	toolbarMention: undefined;
	addMarkdown: {
		style: TMarkdownStyle;
	};
	setKeyboardHeight: number;
	setKeyboardHeightThread: number;
	setComposerHeight: number;
	setComposerHeightThread: number;
	audioFocused: string;
	navigationReady: undefined;
};

export type TKeyEmitterEvent = keyof TEmitterEvents;

export const emitter = mitt<TEmitterEvents>();

// uncomment the line below to log all events
// emitter.on('*', (type, e) => console.log(type, e));
