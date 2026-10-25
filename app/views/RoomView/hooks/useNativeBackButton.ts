import { useLayoutEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackHeaderItem } from '@react-navigation/native-stack';

import i18n from '~/i18n';
import { formatUnreadCount } from '~/lib/methods/helpers/formatUnreadCount';
import { type IRoomViewProps } from '../definitions';
import { useUnreadsCount } from './useUnreadsCount';

export const useNativeBackButton = (rid: string) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const unreadsCount = useUnreadsCount(rid);
	const unreadsLabel = unreadsCount ? formatUnreadCount(unreadsCount) : '';
	// The native back button keeps its old size after a Dynamic Type change.
	// A font-scale-based identifier changes the item props, so the native side recreates it at the new size.
	const { fontScale } = useWindowDimensions();

	useLayoutEffect(() => {
		if (!navigation.canGoBack()) {
			navigation.setOptions({ unstable_headerLeftItems: undefined });
			return;
		}
		const backItem: NativeStackHeaderItem = {
			type: 'button',
			identifier: `room-back-${fontScale}`,
			label: unreadsLabel,
			icon: { type: 'sfSymbol', name: 'chevron.backward' },
			showsLabelWithIcon: true,
			accessibilityLabel: unreadsLabel ? `${i18n.t('Back')}, ${unreadsLabel} ${i18n.t('Unread')}` : i18n.t('Back'),
			onPress: () => navigation.goBack()
		};
		navigation.setOptions({
			headerBackVisible: false,
			unstable_headerLeftItems: ({ tintColor }) => [{ ...backItem, tintColor }]
		});
	}, [navigation, unreadsLabel, fontScale]);
};
