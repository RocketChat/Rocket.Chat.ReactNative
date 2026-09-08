import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type TNavigation } from '../../../stacks/stackType';
import { type ChatsStackParamList } from '../../../stacks/types';

export type TRoomStackParamList = ChatsStackParamList & TNavigation;

export type TRoomScreen = keyof TRoomStackParamList;

export type TRoomStackNavigation = NativeStackNavigationProp<TRoomStackParamList, 'RoomView'>;

export const navigateToScreen = <Screen extends TRoomScreen>({
	navigation,
	isMasterDetail,
	screen,
	params
}: {
	navigation: TRoomStackNavigation;
	isMasterDetail: boolean;
	screen: Screen;
	params?: TRoomStackParamList[Screen];
}): void => {
	if (isMasterDetail) {
		const navigateToModal = navigation.navigate as (
			screen: 'ModalStackNavigator',
			params: { screen: Screen; params?: typeof params }
		) => void;
		navigateToModal('ModalStackNavigator', { screen, params });
		return;
	}
	const navigateDirect: (screen: Screen, params?: TRoomStackParamList[Screen]) => void = navigation.navigate;
	navigateDirect(screen, params);
};
