import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type TNavigation } from '../../stacks/stackType';
import {
	type AdminPanelStackParamList,
	type ChatsStackParamList,
	type DisplayPrefStackParamList,
	type DrawerParamList,
	type E2EEnterYourPasswordStackParamList,
	type E2ESaveYourPasswordStackParamList,
	type InsideStackParamList,
	type NewMessageStackParamList,
	type OutsideModalParamList,
	type OutsideParamList,
	type ProfileStackParamList,
	type SettingsStackParamList
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
