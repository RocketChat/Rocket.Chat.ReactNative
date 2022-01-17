import { NavigatorScreenParams } from '@react-navigation/core';
import { StackNavigationOptions } from '@react-navigation/stack';

import { ISubscription } from './ISubscription';
import { IServer } from './IServer';
import { IAttachment } from './IAttachment';
import { MasterDetailInsideStackParamList } from '../stacks/MasterDetailStack/types';
import { OutsideParamList, InsideStackParamList } from '../stacks/types';

interface INavigationProps {
	route?: any;
	navigation?: any;
	isMasterDetail?: boolean;
}

export type TNavigationOptions = {
	navigationOptions?(props: INavigationProps): StackNavigationOptions;
};

export type SetUsernameStackParamList = {
	SetUsernameView: {
		title: string;
	};
};

export type StackParamList = {
	AuthLoading: undefined;
	OutsideStack: NavigatorScreenParams<OutsideParamList>;
	InsideStack: NavigatorScreenParams<InsideStackParamList>;
	MasterDetailStack: NavigatorScreenParams<MasterDetailInsideStackParamList>;
	SetUsernameStack: NavigatorScreenParams<SetUsernameStackParamList>;
};

export type ShareInsideStackParamList = {
	ShareListView: undefined;
	ShareView: {
		attachments: IAttachment[];
		isShareView?: boolean;
		isShareExtension: boolean;
		serverInfo: IServer;
		text: string;
		room: ISubscription;
		thread: any; // TODO: Change
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
