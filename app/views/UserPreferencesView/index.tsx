import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setUser } from '../../actions/login';
import I18n from '../../i18n';
import log, { logEvent, events } from '../../lib/methods/helpers/log';
import { compareServerVersion } from '../../lib/methods/helpers';
import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import { getUserSelector } from '../../selectors/login';
import { type ProfileStackParamList } from '../../stacks/types';
import { saveUserPreferences } from '../../lib/services/restApi';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import ListPicker from './ListPicker';
import Switch from '../../containers/Switch';
import { type IUser } from '../../definitions';
import { FONT_SIZE_PREFERENCES_KEY } from '../../lib/constants/keys';
import { FONT_SIZE_OPTIONS, useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import { Text, StyleSheet } from 'react-native';
import sharedStyles from '../Styles';
import { useTheme } from '../../theme';

interface IUserPreferencesViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'UserPreferencesView'>;
}

const UserPreferencesView = ({ navigation }: IUserPreferencesViewProps): JSX.Element => {
	const { enableMessageParserEarlyAdoption, id, alsoSendThreadToChannel, settings } = useAppSelector(state =>
		getUserSelector(state)
	);
	const serverVersion = useAppSelector(state => state.server.version);
	const dispatch = useDispatch();
	const convertAsciiEmoji = settings?.preferences?.convertAsciiEmoji;
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	const [fontSize] = useUserPreferences<string>(FONT_SIZE_PREFERENCES_KEY, FONT_SIZE_OPTIONS.NORMAL.toString());
	
	const FONT_SIZE_LABELS = {
		[FONT_SIZE_OPTIONS.SMALL]: 'Small',
		[FONT_SIZE_OPTIONS.NORMAL]: 'Normal',
		[FONT_SIZE_OPTIONS.LARGE]: 'Large',
		[FONT_SIZE_OPTIONS.EXTRA_LARGE]: 'Extra_Large'
	};
	
	const fontSizeValue = fontSize || FONT_SIZE_OPTIONS.NORMAL.toString();
	const currentLabel = FONT_SIZE_LABELS[parseFloat(fontSizeValue) as keyof typeof FONT_SIZE_LABELS] || 'Normal';

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Preferences')
		});
	}, [navigation]);

	const navigateToScreen = (screen: keyof ProfileStackParamList) => {
		logEvent(events.UP_GO_USER_NOTIFICATION_PREF);
		// @ts-ignore
		navigation.navigate(screen);
	};

	const toggleMessageParser = async (value: boolean) => {
		try {
			dispatch(setUser({ enableMessageParserEarlyAdoption: value }));
			await saveUserPreferences({ id, enableMessageParserEarlyAdoption: value });
		} catch (e) {
			log(e);
		}
	};

	const toggleConvertAsciiToEmoji = async (value: boolean) => {
		try {
			dispatch(setUser({ settings: { ...settings, preferences: { convertAsciiEmoji: value } } } as Partial<IUser>));
			await saveUserPreferences({ convertAsciiEmoji: value });
		} catch (e) {
			log(e);
		}
	};

	const setAlsoSendThreadToChannel = async (param: { [key: string]: string }, onError: () => void) => {
		try {
			await saveUserPreferences(param);
			dispatch(setUser(param));
		} catch (e) {
			log(e);
			onError();
		}
	};

	return (
		<SafeAreaView testID='preferences-view'>
			<List.Container>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Notifications'
						onPress={() => navigateToScreen('UserNotificationPrefView')}
						showActionIndicator
						testID='preferences-view-notifications'
					/>
					<List.Separator />
				</List.Section>
				{compareServerVersion(serverVersion, 'lowerThan', '5.0.0') ? (
					<List.Section>
						<List.Separator />
						<List.Item
							title='Enable_Message_Parser'
							testID='preferences-view-enable-message-parser'
							right={() => <Switch value={enableMessageParserEarlyAdoption} onValueChange={toggleMessageParser} />}
						/>
						<List.Separator />
					</List.Section>
				) : null}
				{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0') ? (
					<List.Section title='Also_send_thread_message_to_channel_behavior'>
						<List.Separator />
						<ListPicker
							onChangeValue={setAlsoSendThreadToChannel}
							preference='alsoSendThreadToChannel'
							value={alsoSendThreadToChannel}
							title='Message_composer_Send_to_channel'
							testID='preferences-view-enable-message-parser'
						/>
						<List.Separator />
						<List.Info info='Accounts_Default_User_Preferences_alsoSendThreadToChannel_Description' />
					</List.Section>
				) : null}
				<List.Section>
					<List.Separator />
					<List.Item
						title='Convert_ASCII_to_emoji'
						testID='preferences-view-convert-ascii-to-emoji'
						right={() => <Switch value={convertAsciiEmoji} onValueChange={toggleConvertAsciiToEmoji} />}
						onPress={() => toggleConvertAsciiToEmoji(!convertAsciiEmoji)}
					/>
					<List.Separator />
				</List.Section>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Font_Size'
						onPress={() => navigateToScreen('FontSizePickerView')}
						showActionIndicator
						testID='preferences-view-font-size'
						right={() => (
							<Text style={[styles.fontSizeLabel, { color: colors.fontHint, fontSize: scaleFontSize(16) }]}>
								{I18n.t(currentLabel, { defaultValue: currentLabel }) ?? currentLabel}
							</Text>
						)}
					/>
					<List.Separator />
					<List.Info info='Font_Size_Description' />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	fontSizeLabel: {
		...sharedStyles.textRegular
	}
});

export default UserPreferencesView;
