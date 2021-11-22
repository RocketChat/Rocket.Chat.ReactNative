import { NavigatorScreenParams } from '@react-navigation/core';

import { MasterDetailInsideStackParamList } from './stacks/MasterDetailStack/types';
import { OutsideParamList, InsideStackParamList } from './stacks/types';

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
