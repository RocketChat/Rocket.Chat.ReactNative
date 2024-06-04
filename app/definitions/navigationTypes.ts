import { NavigatorScreenParams } from '@react-navigation/core';
import { StackNavigationOptions } from '@react-navigation/stack';

import { TSubscriptionModel } from './ISubscription';
import { TServerModel } from './IServer';
import { IAttachment } from './IAttachment';
import { MasterDetailInsideStackParamList } from '../stacks/MasterDetailStack/types';
import { MainParamList} from '../stacks/types';

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
	SplashScreen: undefined;
	AuthLoading: undefined;
	MainTabs: NavigatorScreenParams<TabParamList>;
	LoginView: {
		title: string;
	};
	// InsideStack: NavigatorScreenParams<InsideStackParamList>;
	// MasterDetailStack: NavigatorScreenParams<MasterDetailInsideStackParamList>;
	// SetUsernameStack: NavigatorScreenParams<SetUsernameStackParamList>;
};
export type MainTabParamList = {
	Hot: undefined
	Recommend: undefined
	New:undefined
	Like: undefined
	// Create: NavigatorScreenParams<CreateParamList>;
};

export type TabParamList = {
	首页: NavigatorScreenParams<MainParamList>;
	Ai作图: undefined;
	Profile: undefined;
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

export type ShareOutsideStackParamList = {
	WithoutServersView: undefined;
};

export type ShareAppStackParamList = {
	AuthLoading?: undefined;
	OutsideStack?: NavigatorScreenParams<ShareOutsideStackParamList>;
	InsideStack?: NavigatorScreenParams<ShareInsideStackParamList>;
};
