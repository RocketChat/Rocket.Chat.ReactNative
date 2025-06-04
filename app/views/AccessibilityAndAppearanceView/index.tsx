import React, { useLayoutEffect } from 'react';
import { Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { AccessibilityStackParamList } from '../../stacks/types';
import { useAppSelector } from '../../lib/hooks';
import { useUserPreferences } from '../../lib/methods';
import { USER_MENTIONS_PREFERENCES_KEY, ROOM_MENTIONS_PREFERENCES_KEY, AUTOPLAY_GIFS_PREFERENCES_KEY } from '../../lib/constants';

const AccessibilityAndAppearanceView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<AccessibilityStackParamList>>();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail as boolean);
	const [mentionsWithAtSymbol, setMentionsWithAtSymbol] = useUserPreferences<boolean>(USER_MENTIONS_PREFERENCES_KEY);
	const [roomsWithHashTagSymbol, setRoomsWithHashTagSymbol] = useUserPreferences<boolean>(ROOM_MENTIONS_PREFERENCES_KEY);
	const [autoplayGifs, setAutoplayGifs] = useUserPreferences<boolean>(AUTOPLAY_GIFS_PREFERENCES_KEY);

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
			headerLeft: isMasterDetail
				? undefined
				: () => <HeaderButton.Drawer navigation={navigation} testID='accessibility-view-drawer' />
		});
	}, []);
	return (
		<SafeAreaView>
			<StatusBar />
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
					<List.Item testID='accessibility' title='Autoplay_gifs' right={renderAutoplayGifs} onPress={toggleAutoplayGifs} />
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
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default AccessibilityAndAppearanceView;
