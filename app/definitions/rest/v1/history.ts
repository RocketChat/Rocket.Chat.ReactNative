import type { IMessageFromServer } from '../../IMessage';

export type HistoryEndpoints = {
	'channels.history': {
		GET: (params: { roomId: string; count: number; latest?: string }) => {
			messages: IMessageFromServer[];
		};
	};
	'im.history': {
		GET: (params: { roomId: string; count: number; latest?: string }) => {
			messages: IMessageFromServer[];
		};
	};
	'groups.history': {
		GET: (params: { roomId: string; count: number; latest?: string }) => {
			messages: IMessageFromServer[];
		};
	};
};
