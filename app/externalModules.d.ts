declare module 'remove-markdown';
declare module '@rocket.chat/sdk';
declare module 'react-native-mime-types';
declare module 'react-native-restart';
declare module 'react-native-math-view';
declare module '@env' {
	export const RUNNING_E2E_TESTS: string;
	export const USE_STORYBOOK: string;
}
declare module 'tiny-events' {
	export class EventEmitter {
		_listeners: { [type: string]: Function[] };
		on(event: string, listener: Function): EventEmitter;
		once(event: string, listener: Function): EventEmitter;
		off(event?: string, listener?: Function): EventEmitter;
		emit(event: string, ...args: any[]): EventEmitter;
	}
}
