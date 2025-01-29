import React, { useLayoutEffect } from 'react';
import { Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { AccessibilityStackParamList } from '../../stacks/types';
import { useAppSelector } from '../../lib/hooks';
import { useMentionsPreferences } from '../../MentionsPreferences';

const AccessibilityAndAppearanceView = (): React.ReactElement => {
	const navigation = useNavigation<NativeStackNavigationProp<AccessibilityStackParamList>>();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail as boolean);
	const { roomsWithHashTagSymbol, mentionsWithAtSymbol, toggleMentionsWithAtSymbol, togglRoomsWithHashTag } =
		useMentionsPreferences();

	const renderMentionsWithAtSymbolSwitch = () => (
		<Switch value={mentionsWithAtSymbol} onValueChange={toggleMentionsWithAtSymbol} />
	);
	const renderRoomsWithHashTagSwitch = () => <Switch value={roomsWithHashTagSymbol} onValueChange={togglRoomsWithHashTag} />;

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Accessibility_and_Appearance'),
			headerLeft: () =>
				isMasterDetail ? (
					<HeaderButton.CloseModal navigation={navigation} testID='settings-view-close' />
				) : (
					<HeaderButton.Drawer navigation={navigation} testID='settings-view-drawer' />
				)
		});
	}, []);
	return (
		<SafeAreaView>
			<StatusBar />
			<List.Container testID='display-view-list'>
				<List.Section>
					<List.Separator />
					<List.Item
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
					<List.Item title='Mentions_With_@_Symbol' right={renderMentionsWithAtSymbolSwitch} />
					<List.Separator />
					<List.Item title='Rooms_With_#_Symbol' right={renderRoomsWithHashTagSwitch} />
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default AccessibilityAndAppearanceView;
