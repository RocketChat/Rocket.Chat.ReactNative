import { type NavigatorScreenParams } from '@react-navigation/core';
import { type NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { type MasterDetailInsideStackParamList } from '../stacks/MasterDetailStack/types';
import { type OutsideParamList, type InsideStackParamList } from '../stacks/types';
import { type ShareInsideStackParamList } from '../stacks/ShareExtensionStack';

export type { ShareInsideStackParamList };

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
