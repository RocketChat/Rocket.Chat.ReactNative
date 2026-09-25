import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackHeaderItem } from '@react-navigation/native-stack';

import i18n from '~/i18n';
import { useTheme } from '~/theme';
import { type IRoomViewProps } from '../definitions';
import { useUnreadsCount } from './useUnreadsCount';

export const formatUnreadsCount = (unreadsCount: number | null) => {
	if (!unreadsCount) {
		return '';
	}
	return unreadsCount > 99 ? '+99' : unreadsCount.toString();
};

export const useNativeBackButton = (enabled: boolean, rid?: string) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const { colors } = useTheme();
	const unreadsLabel = formatUnreadsCount(useUnreadsCount(enabled ? rid : undefined));

	useLayoutEffect(() => {
		if (!enabled || !navigation.canGoBack()) {
			return;
		}
		const backItem: NativeStackHeaderItem = {
			type: 'button',
			label: unreadsLabel,
			icon: { type: 'sfSymbol', name: 'chevron.backward' },
			showsLabelWithIcon: true,
			tintColor: colors.fontDefault,
			accessibilityLabel: unreadsLabel ? `${i18n.t('Back')}, ${unreadsLabel} ${i18n.t('Unread')}` : i18n.t('Back'),
			onPress: () => navigation.goBack()
		};
		navigation.setOptions({ headerBackVisible: false, unstable_headerLeftItems: () => [backItem] });
	}, [colors.fontDefault, enabled, navigation, unreadsLabel]);
};
