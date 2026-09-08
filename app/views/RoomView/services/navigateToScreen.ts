import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type TNavigation } from '../../../stacks/stackType';
import { type ChatsStackParamList } from '../../../stacks/types';

export type TRoomStackParamList = ChatsStackParamList & TNavigation;

export type TRoomScreen = keyof TRoomStackParamList;

export type TRoomStackNavigation = NativeStackNavigationProp<TRoomStackParamList, 'RoomView'>;

type TScreenParams<Screen extends TRoomScreen> = undefined extends TRoomStackParamList[Screen]
	? { params?: TRoomStackParamList[Screen] }
	: { params: TRoomStackParamList[Screen] };

type TNavigateToScreenOptions<Screen extends TRoomScreen> = {
	navigation: TRoomStackNavigation;
	isMasterDetail: boolean;
	screen: Screen;
} & TScreenParams<Screen>;

export const navigateToScreen = <Screen extends TRoomScreen>({
	navigation,
	isMasterDetail,
	screen,
	params
}: TNavigateToScreenOptions<Screen>): void => {
	if (isMasterDetail) {
		const navigateToModal = navigation.navigate as (
			screen: 'ModalStackNavigator',
			params: { screen: Screen; params?: TRoomStackParamList[Screen] }
		) => void;
		navigateToModal('ModalStackNavigator', { screen, params });
		return;
	}
	const navigateDirect: (screen: Screen, params?: TRoomStackParamList[Screen]) => void = navigation.navigate;
	navigateDirect(screen, params);
};
