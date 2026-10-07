import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackHeaderItem } from '@react-navigation/native-stack';

import i18n from '~/i18n';
import { useTheme } from '~/theme';
import { formatUnreadCount } from '~/lib/methods/helpers/formatUnreadCount';
import { type IRoomViewProps } from '../definitions';
import { useUnreadsCount } from './useUnreadsCount';

export const useNativeBackButton = (rid: string) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const { colors } = useTheme();
	const unreadsCount = useUnreadsCount(rid);
	const unreadsLabel = unreadsCount ? formatUnreadCount(unreadsCount) : '';

	useLayoutEffect(() => {
		if (!navigation.canGoBack()) {
			navigation.setOptions({ unstable_headerLeftItems: undefined });
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
	}, [colors.fontDefault, navigation, unreadsLabel]);
};
