import mitt from 'mitt';

import { TMarkdownStyle } from '../../../containers/MessageComposer/interfaces';

export type TEmitterEvents = {
	toolbarMention: undefined;
	addMarkdown: {
		style: TMarkdownStyle;
	};
	setKeyboardHeight: number;
	setKeyboardHeightThread: number;
	setComposerHeight: number;
	setComposerHeightThread: number;
};

export type TKeyEmitterEvent = keyof TEmitterEvents;

export const emitter = mitt<TEmitterEvents>();

emitter.on('*', (type, e) => console.log(type, e));
