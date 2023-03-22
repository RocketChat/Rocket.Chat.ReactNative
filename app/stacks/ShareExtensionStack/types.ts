import { NavigatorScreenParams } from '@react-navigation/core';

import { TSubscriptionModel } from '../../definitions/ISubscription';
import { TServerModel } from '../../definitions/IServer';
import { IAttachment } from '../../definitions/IAttachment';
import { IMessage, TThreadModel } from '../../definitions';

export type ShareInsideStackParamList = {
	ShareListView: undefined;
	ShareView: {
		attachments: IAttachment[];
		isShareView?: boolean;
		isShareExtension: boolean;
		serverInfo: TServerModel;
		text: string;
		room: TSubscriptionModel;
		thread?: TThreadModel;
		replying?: boolean;
		replyingMessage?: IMessage;
		closeReply?: Function;
	};
	SelectServerView: undefined;
};

export type ShareOutsideStackParamList = {
	WithoutServersView: undefined;
};

export type ShareAppStackParamList = {
	AuthLoading?: undefined;
	OutsideStack?: NavigatorScreenParams<ShareOutsideStackParamList>;
	InsideStack?: NavigatorScreenParams<ShareInsideStackParamList>;
};
