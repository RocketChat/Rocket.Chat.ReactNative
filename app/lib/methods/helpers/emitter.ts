import mitt from 'mitt';

import { TMarkdownStyle } from '../../../containers/MessageComposer/interfaces';

type TDynamicMediaDownloadEvents = {
	[key: `downloadMedia${string}`]: string;
};

export type TEmitterEvents = TDynamicMediaDownloadEvents & {
	toolbarMention: undefined;
	addMarkdown: {
		style: TMarkdownStyle;
	};
	setKeyboardHeight: number;
	setKeyboardHeightThread: number;
	setComposerHeight: number;
	setComposerHeightThread: number;
	audioFocused: string;
};

export type TKeyEmitterEvent = keyof TEmitterEvents;

export const emitter = mitt<TEmitterEvents>();

// uncomment the line below to log all events
// emitter.on('*', (type, e) => console.log(type, e));
