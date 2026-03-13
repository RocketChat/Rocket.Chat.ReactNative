import { type NavigatorScreenParams, type ParamListBase } from '@react-navigation/core';
import { type RouteProp } from '@react-navigation/native';
import { type NativeStackNavigationOptions, type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type TSubscriptionModel } from './ISubscription';
import { type TServerModel } from './IServer';
import { type IAttachment } from './IAttachment';
import { type MasterDetailInsideStackParamList } from '../stacks/MasterDetailStack/types';
import { type OutsideParamList, type InsideStackParamList } from '../stacks/types';

export interface INavigationProps {
	route?: RouteProp<ParamListBase, string>;
	navigation?: NativeStackNavigationProp<ParamListBase, string>;
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
