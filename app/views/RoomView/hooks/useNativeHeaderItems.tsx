import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import { type IHeaderAction, nativeHeaderItems } from '~/lib/methods/helpers/navigation/headerActions';
import LeftButtons from '../components/LeftButtons';
import { type IRoomViewProps, type RoomStore } from '../definitions';

export const useNativeAvatarItem = (rid: string, roomStore: RoomStore) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

	useLayoutEffect(() => {
		navigation.setOptions({
			unstable_headerLeftItems: () => [
				{ type: 'custom', element: <LeftButtons rid={rid} roomStore={roomStore} />, hidesSharedBackground: true }
			]
		});
	}, [navigation, rid, roomStore]);
};

export const useNativeRightItems = (actions: IHeaderAction[]) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

	useLayoutEffect(() => {
		navigation.setOptions({ unstable_headerRightItems: () => nativeHeaderItems(actions) });
	}, [navigation, actions]);
};
