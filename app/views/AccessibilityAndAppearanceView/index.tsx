import React, { useLayoutEffect } from 'react';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import Switch from '../../containers/Switch';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import I18n from '../../i18n';
import { type AccessibilityStackParamList } from '../../stacks/types';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import {
	USER_MENTIONS_PREFERENCES_KEY,
	ROOM_MENTIONS_PREFERENCES_KEY,
	SHOW_UNDERLINE_FOR_LINKS_PREFERENCES_KEY,
	AUTOPLAY_GIFS_PREFERENCES_KEY,
	ALERT_DISPLAY_TYPE_PREFERENCES_KEY
} from '../../lib/constants/keys';
import ListPicker from './components/ListPicker';

export type TAlertDisplayType = 'TOAST' | 'DIALOG';

const AccessibilityAndAppearanceView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<AccessibilityStackParamList>>();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail as boolean);
	const [mentionsWithAtSymbol, setMentionsWithAtSymbol] = useUserPreferences<boolean>(USER_MENTIONS_PREFERENCES_KEY);
	const [roomsWithHashTagSymbol, setRoomsWithHashTagSymbol] = useUserPreferences<boolean>(ROOM_MENTIONS_PREFERENCES_KEY);
	const [showUnderlineForLinks, setShowUnderlineForLinks] = useUserPreferences<boolean>(SHOW_UNDERLINE_FOR_LINKS_PREFERENCES_KEY);
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

	const toggleShowUnderlineForLinks = () => {
		setShowUnderlineForLinks(!showUnderlineForLinks);
	};

	const toggleAutoplayGifs = () => {
		setAutoplayGifs(!autoplayGifs);
	};

	const renderMentionsWithAtSymbolSwitch = () => (
		<Switch value={mentionsWithAtSymbol} onValueChange={toggleMentionsWithAtSymbol} />
	);
	const renderRoomsWithHashTagSwitch = () => <Switch value={roomsWithHashTagSymbol} onValueChange={toggleRoomsWithHashTag} />;

	const renderShowUnderlineForLinksSwitch = () => (
		<Switch value={showUnderlineForLinks} onValueChange={toggleShowUnderlineForLinks} />
	);

	const renderAutoplayGifs = () => <Switch value={autoplayGifs} onValueChange={toggleAutoplayGifs} />;

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Accessibility_and_Appearance'),
			headerLeft: isMasterDetail
				? undefined
				: () => <HeaderButton.Drawer navigation={navigation} testID='accessibility-view-drawer' />
		});
	}, []);
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
					/>
					<List.Separator />
					<List.Item
						testID='accessibility-mentions-with-at-symbol-switch'
						title='Mentions_With_@_Symbol'
						right={renderMentionsWithAtSymbolSwitch}
						onPress={toggleMentionsWithAtSymbol}
					/>
					<List.Separator />
					<List.Item
						testID='accessibility-rooms-with-hashtag-symbol-switch'
						title='Rooms_With_#_Symbol'
						right={renderRoomsWithHashTagSwitch}
						onPress={toggleRoomsWithHashTag}
					/>
					<List.Separator />
					<List.Item
						testID='accessibility-show-underline-for-links-switch'
						title='Show_underline_for_links'
						right={renderShowUnderlineForLinksSwitch}
						onPress={toggleShowUnderlineForLinks}
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
						value={alertDisplayType}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default AccessibilityAndAppearanceView;
