import { useLayoutEffect } from 'react';
import { PixelRatio, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { type IRoomViewProps } from '../definitions';

export const useEmptyRoomHeader = (): void => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

	useLayoutEffect(() => {
		if (hasNativeHeaderBar) {
			return;
		}
		const height = 37 * PixelRatio.getFontScale();
		navigation.setOptions({ headerLeft: () => <View style={{ height }} /> });
	}, [navigation]);
};
