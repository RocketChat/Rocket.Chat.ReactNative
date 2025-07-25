import { NavigatorScreenParams } from '@react-navigation/core';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { TSubscriptionModel } from './ISubscription';
import { TServerModel } from './IServer';
import { IAttachment } from './IAttachment';
import { MasterDetailInsideStackParamList } from '../stacks/MasterDetailStack/types';
import { OutsideParamList, InsideStackParamList } from '../stacks/types';

interface INavigationProps {
	route?: any;
	navigation?: any;
	isMasterDetail?: boolean;
}

export type TNavigationOptions = {
	navigationOptions?(props: INavigationProps): NativeStackNavigationOptions;
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
	ShareExtensionStack: NavigatorScreenParams<ShareInsideStackParamList>;
};

export type ShareInsideStackParamList = {
	ShareListView: undefined;
	ShareView: {
		attachments: IAttachment[];
		isShareView?: boolean;
		isShareExtension: boolean;
		serverInfo: TServerModel;
		text: string;
		room: TSubscriptionModel;
		thread?: any; // TODO: Change
	};
	SelectServerView: undefined;
};
