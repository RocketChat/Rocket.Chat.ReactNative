import { DrawerActions, useNavigation } from '@react-navigation/native';
import { headerItems } from '~/lib/methods/helpers/navigation';
import { useLayoutEffect } from 'react';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { withKeyboardFocus } from 'react-native-external-keyboard';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import Switch from '~/containers/Switch';
import * as List from '~/containers/List';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { type AccessibilityStackParamList } from '~/stacks/types';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import {
	USER_MENTIONS_PREFERENCES_KEY,
	ROOM_MENTIONS_PREFERENCES_KEY,
	AUTOPLAY_GIFS_PREFERENCES_KEY,
	ALERT_DISPLAY_TYPE_PREFERENCES_KEY
} from '~/lib/constants/keys';
import ListPicker from './components/ListPicker';

const DrawerItem = withKeyboardFocus(HeaderButton.Item);

export type TAlertDisplayType = 'TOAST' | 'DIALOG';

const AccessibilityAndAppearanceView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<AccessibilityStackParamList>>();
	const isMasterDetail = useMasterDetail();
	const [mentionsWithAtSymbol, setMentionsWithAtSymbol] = useUserPreferences<boolean>(USER_MENTIONS_PREFERENCES_KEY, false);
	const [roomsWithHashTagSymbol, setRoomsWithHashTagSymbol] = useUserPreferences<boolean>(ROOM_MENTIONS_PREFERENCES_KEY, false);
	const [autoplayGifs, setAutoplayGifs] = useUserPreferences<boolean>(AUTOPLAY_GIFS_PREFERENCES_KEY, true);
	const [alertDisplayType, setAlertDisplayType] = useUserPreferences<TAlertDisplayType>(
		ALERT_DISPLAY_TYPE_PREFERENCES_KEY,
		'TOAST'
	);

	const toggleMentionsWithAtSymbol = () => {
		setMentionsWithAtSymbol(!mentionsWithAtSymbol);
	};

	const toggleRoomsWithHashTag = () => {
		setRoomsWithHashTagSymbol(!roomsWithHashTagSymbol);
	};

	const toggleAutoplayGifs = () => {
		setAutoplayGifs(!autoplayGifs);
	};

	const renderMentionsWithAtSymbolSwitch = () => (
		<Switch value={mentionsWithAtSymbol} onValueChange={toggleMentionsWithAtSymbol} />
	);
	const renderRoomsWithHashTagSwitch = () => <Switch value={roomsWithHashTagSymbol} onValueChange={toggleRoomsWithHashTag} />;

	const renderAutoplayGifs = () => <Switch value={autoplayGifs} onValueChange={toggleAutoplayGifs} />;

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Accessibility_and_Appearance'),
			...headerItems({
				left: isMasterDetail
					? undefined
					: [
							{
								type: 'button',
								label: I18n.t('Menu'),
								iconName: 'hamburguer',
								androidElement: (
									<DrawerItem
										autoFocus
										iconName='hamburguer'
										accessibilityLabel={I18n.t('Menu')}
										onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
										testID='accessibility-view-drawer'
									/>
								),
								onPress: () => navigation.dispatch(DrawerActions.toggleDrawer()),
								testID: 'accessibility-view-drawer'
							}
						]
			})
		});
	}, [navigation, isMasterDetail]);
	return (
		<SafeAreaView>
			<List.Container testID='accessibility-view-list'>
				<List.Section>
					<List.Separator />
					<List.Item
						testID='accessibility-theme-button'
						showActionIndicator
						title='Theme'
						left={() => <List.Icon name='moon' />}
						onPress={() => navigation.navigate('ThemeView')}
					/>
					<List.Separator />
					<List.Item
						testID='accessibility-display-button'
						showActionIndicator
						title='Display'
						left={() => <List.Icon name='sort' />}
						onPress={() => navigation.navigate('DisplayPrefsView')}
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						testID='accessibility-autoplay-gifs-switch'
						title='Autoplay_gifs'
						right={renderAutoplayGifs}
						onPress={toggleAutoplayGifs}
						accessibilityRole='switch'
						additionalAccessibilityLabel={autoplayGifs}
						additionalAccessibilityLabelCheck
					/>
					<List.Separator />
					<List.Item
						testID='accessibility-mentions-with-at-symbol-switch'
						title='Mentions_With_@_Symbol'
						right={renderMentionsWithAtSymbolSwitch}
						onPress={toggleMentionsWithAtSymbol}
						accessibilityRole='switch'
						additionalAccessibilityLabel={mentionsWithAtSymbol}
						additionalAccessibilityLabelCheck
					/>
					<List.Separator />
					<List.Item
						testID='accessibility-rooms-with-hashtag-symbol-switch'
						title='Rooms_With_#_Symbol'
						right={renderRoomsWithHashTagSwitch}
						onPress={toggleRoomsWithHashTag}
						accessibilityRole='switch'
						additionalAccessibilityLabel={roomsWithHashTagSymbol}
						additionalAccessibilityLabelCheck
					/>
					<List.Separator />
				</List.Section>
				<List.Section>
					<List.Separator />
					<ListPicker
						onChangeValue={value => {
							setAlertDisplayType(value);
						}}
						title={I18n.t('A11y_appearance_show_alerts_as')}
						value={alertDisplayType || 'TOAST'}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default AccessibilityAndAppearanceView;
