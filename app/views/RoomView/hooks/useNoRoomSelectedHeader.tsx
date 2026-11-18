import { useLayoutEffect } from 'react';
import { PixelRatio, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { hasNativeHeaderBar } from '~/lib/methods/helpers/deviceInfo';
import { type IRoomViewProps } from '../definitions';

export const useNoRoomSelectedHeader = (): void => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

	useLayoutEffect(() => {
		if (hasNativeHeaderBar) {
			return;
		}
		const height = 37 * PixelRatio.getFontScale();
		navigation.setOptions({ headerLeft: () => <View style={{ height }} /> });
	}, [navigation]);
};
