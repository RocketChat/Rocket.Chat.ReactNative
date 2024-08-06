import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TNavigation } from '../../stacks/stackType';
import {
	AdminPanelStackParamList,
	ChatsStackParamList,
	DisplayPrefStackParamList,
	DrawerParamList,
	E2EEnterYourPasswordStackParamList,
	E2ESaveYourPasswordStackParamList,
	InsideStackParamList,
	NewMessageStackParamList,
	OutsideModalParamList,
	OutsideParamList,
	ProfileStackParamList,
	SettingsStackParamList
} from '../../stacks/types';

type TRoutes =
	| ChatsStackParamList
	| ProfileStackParamList
	| SettingsStackParamList
	| AdminPanelStackParamList
	| DisplayPrefStackParamList
	| DrawerParamList
	| NewMessageStackParamList
	| E2ESaveYourPasswordStackParamList
	| E2EEnterYourPasswordStackParamList
	| InsideStackParamList
	| OutsideParamList
	| OutsideModalParamList
	| TNavigation;

export function useAppNavigation<ParamList extends TRoutes, RouteName extends keyof ParamList = keyof ParamList>() {
	const navigation = useNavigation<NativeStackNavigationProp<ParamList, RouteName>>();
	return navigation;
}

export function useAppRoute<ParamList extends TRoutes, RouteName extends keyof ParamList = keyof ParamList>() {
	const route = useRoute<RouteProp<ParamList, RouteName>>();
	return route;
}
