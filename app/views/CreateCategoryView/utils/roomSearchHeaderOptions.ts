import { type NativeStackNavigationOptions } from '@react-navigation/native-stack';

import I18n from '~/i18n';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { stackedSearchBarOptions } from '~/lib/methods/helpers/navigation';

export const roomSearchHeaderOptions = (onChangeText: (text: string) => void): NativeStackNavigationOptions =>
	hasNativeHeaderBar
		? {
				headerTransparent: true,
				headerSearchBarOptions: stackedSearchBarOptions({ onChangeText, placeholder: I18n.t('Search_rooms') })
			}
		: {};
