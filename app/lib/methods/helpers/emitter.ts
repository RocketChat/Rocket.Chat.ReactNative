import mitt from 'mitt';

import { type TMarkdownStyle } from '../../../containers/MessageComposer/interfaces';

type TDynamicMediaDownloadEvents = {
	[key: `downloadMedia${string}`]: string;
};

/** Emitted once the server acks the room's `stream-room-messages` subscription, on every (re)connect. */
type TRoomStreamReadyEvents = {
	[key: `roomStreamReady${string}`]: undefined;
};

export const roomStreamReadyEvent = (rid: string) => `roomStreamReady${rid}` as const;

export type TEmitterEvents = TDynamicMediaDownloadEvents &
	TRoomStreamReadyEvents & {
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
