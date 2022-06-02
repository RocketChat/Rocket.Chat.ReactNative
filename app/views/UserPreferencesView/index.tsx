import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Switch } from 'react-native';
import { useDispatch } from 'react-redux';

import { setUser } from '../../actions/login';
import I18n from '../../i18n';
import log, { logEvent, events } from '../../utils/log';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { SWITCH_TRACK_COLOR } from '../../lib/constants';
import { getUserSelector } from '../../selectors/login';
import { ProfileStackParamList } from '../../stacks/types';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';

interface IUserPreferencesViewProps {
	navigation: StackNavigationProp<ProfileStackParamList, 'UserPreferencesView'>;
	theme: string;
}

const UserPreferencesView = ({ navigation }: IUserPreferencesViewProps): JSX.Element => {
	const { enableMessageParserEarlyAdoption, timeFormat, id } = useAppSelector(state => getUserSelector(state));
	const dispatch = useDispatch();
	const { colors } = useTheme();

	interface ITimeFormats {
		label: string;
		value: number;
		format: string;
	}

	const timeFormats: ITimeFormats[] = [
		{
			label: '12_Hour',
			value: 1,
			format: 'h:mm A'
		},
		{
			label: '24_Hour',
			value: 2,
			format: 'H:mm'
		}
	];

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Preferences')
		});
	}, [navigation]);

	const navigateToScreen = (screen: keyof ProfileStackParamList) => {
		logEvent(events.UP_GO_USER_NOTIFICATION_PREF);
		navigation.navigate(screen);
	};

	const toggleMessageParser = async (value: boolean) => {
		try {
			dispatch(setUser({ enableMessageParserEarlyAdoption: value }));
			await Services.saveUserPreferences({ id, enableMessageParserEarlyAdoption: value });
		} catch (e) {
			log(e);
		}
	};

	const renderMessageParserSwitch = (value: boolean) => (
		<Switch value={value} trackColor={SWITCH_TRACK_COLOR} onValueChange={toggleMessageParser} />
	);

	const renderIcon = () => <List.Icon name='check' color={colors.tintColor} />;

	const onChangeTimeFormat = async (item: ITimeFormats) => {
		try {
			dispatch(setUser({ timeFormat: item.format }));
			await Services.saveUserPreferences({ id, clockMode: item.value });
		} catch (e) {
			log(e);
		}
	};

	return (
		<SafeAreaView testID='preferences-view'>
			<StatusBar />
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
				<List.Section>
					<List.Separator />
					<List.Item
						title='Enable_Message_Parser'
						testID='preferences-view-enable-message-parser'
						right={() => renderMessageParserSwitch(enableMessageParserEarlyAdoption)}
					/>
					<List.Separator />
				</List.Section>
				<List.Section title='Message_time_format'>
					<List.Separator />
					<List.Item
						title={timeFormats[0].label}
						onPress={() => onChangeTimeFormat(timeFormats[0])}
						right={() => (timeFormat === timeFormats[0].format ? renderIcon() : null)}
					/>
					<List.Separator />
					<List.Item
						title={timeFormats[1].label}
						onPress={() => onChangeTimeFormat(timeFormats[1])}
						right={() => (timeFormat === timeFormats[1].format ? renderIcon() : null)}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default UserPreferencesView;
