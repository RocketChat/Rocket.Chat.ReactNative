import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { connect } from 'react-redux';

import { themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { getUserSelector } from '../../selectors/login';
import sharedStyles from '../Styles';
import { OPTIONS } from './options';
import { ProfileStackParamList } from '../../stacks/types';

const styles = StyleSheet.create({
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

type TKey = 'desktopNotifications' | 'pushNotifications' | 'emailNotificationMode';

interface IUserNotificationPreferencesViewState {
	preferences: {
		desktopNotifications?: string;
		pushNotifications?: string;
		emailNotificationMode?: string;
	};
	loading: boolean;
}

interface IUserNotificationPreferencesViewProps {
	navigation: StackNavigationProp<ProfileStackParamList, 'UserNotificationPrefView'>;
	theme: string;
	user: {
		id: string;
	};
}

class UserNotificationPreferencesView extends React.Component<
	IUserNotificationPreferencesViewProps,
	IUserNotificationPreferencesViewState
> {
	static navigationOptions = (): StackNavigationOptions => ({
		title: I18n.t('Notification_Preferences')
	});

	constructor(props: IUserNotificationPreferencesViewProps) {
		super(props);
		this.state = {
			preferences: {},
			loading: false
		};
	}

	async componentDidMount() {
		const { user } = this.props;
		const { id } = user;
		const result = await RocketChat.getUserPreferences(id);
		const { preferences } = result;
		this.setState({ preferences, loading: true });
	}

	findDefaultOption = (key: TKey) => {
		const { preferences } = this.state;
		const option = preferences[key] ? OPTIONS[key].find(item => item.value === preferences[key]) : OPTIONS[key][0];
		return option;
	};

	renderPickerOption = (key: TKey) => {
		const { theme } = this.props;
		const text = this.findDefaultOption(key);
		return <Text style={[styles.pickerText, { color: themes[theme].actionTintColor }]}>{I18n.t(text?.label)}</Text>;
	};

	pickerSelection = (title: string, key: TKey) => {
		const { preferences } = this.state;
		const { navigation } = this.props;
		let values = OPTIONS[key];

		const defaultOption = this.findDefaultOption(key);
		if (OPTIONS[key][0]?.value !== 'default') {
			const defaultValue = { label: `${I18n.t('Default')} (${I18n.t(defaultOption?.label)})` } as {
				label: string;
				value: string;
			};
			values = [defaultValue, ...OPTIONS[key]];
		}

		navigation.navigate('PickerView', {
			title,
			data: values,
			value: preferences[key],
			onChangeValue: (value: string) => this.onValueChangePicker(key, value ?? defaultOption?.value)
		});
	};

	onValueChangePicker = (key: TKey, value: string) => this.saveNotificationPreferences({ [key]: value.toString() });

	saveNotificationPreferences = async (params: { [key: string]: string }) => {
		const { user } = this.props;
		const { id } = user;
		const result = await RocketChat.setUserPreferences(id, params);
		const {
			user: { settings }
		} = result;
		this.setState({ preferences: settings.preferences });
	};

	render() {
		const { theme } = this.props;
		const { loading } = this.state;
		return (
			<SafeAreaView testID='user-notification-preference-view'>
				<StatusBar />
				<List.Container>
					{loading ? (
						<>
							<List.Section title='Desktop_Notifications'>
								<List.Separator />
								<List.Item
									title='Alert'
									testID='user-notification-preference-view-alert'
									onPress={(title: string) => this.pickerSelection(title, 'desktopNotifications')}
									right={() => this.renderPickerOption('desktopNotifications')}
								/>
								<List.Separator />
								<List.Info info='Desktop_Alert_info' />
							</List.Section>

							<List.Section title='Push_Notifications'>
								<List.Separator />
								<List.Item
									title='Alert'
									testID='user-notification-preference-view-push-notification'
									onPress={(title: string) => this.pickerSelection(title, 'pushNotifications')}
									right={() => this.renderPickerOption('pushNotifications')}
								/>
								<List.Separator />
								<List.Info info='Push_Notifications_Alert_Info' />
							</List.Section>

							<List.Section title='Email'>
								<List.Separator />
								<List.Item
									title='Alert'
									testID='user-notification-preference-view-email-alert'
									onPress={(title: string) => this.pickerSelection(title, 'emailNotificationMode')}
									right={() => this.renderPickerOption('emailNotificationMode')}
								/>
								<List.Separator />
								<List.Info info='You_need_to_verifiy_your_email_address_to_get_notications' />
							</List.Section>
						</>
					) : (
						<ActivityIndicator theme={theme} />
					)}
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: any) => ({
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(UserNotificationPreferencesView));
