import React from 'react';
import { Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { OPTIONS } from './options';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { getUserSelector } from '../../selectors/login';
import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

class UserNotificationPreferencesView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Notification_Preferences')
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string
		})
	};

	constructor(props) {
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

	findOption = (key) => {
		const { preferences } = this.state;
		const option = preferences[key] ? OPTIONS[key].find(item => item.value === preferences[key]) : OPTIONS[key][0];
		return option;
	}

	renderPickerOption = (key) => {
		const { theme } = this.props;
		const text = this.findOption(key);
		return <Text style={[styles.pickerText, { color: themes[theme].actionTintColor }]}>{I18n.t(text?.label, { defaultValue: text?.label, second: text?.second })}</Text>;
	}

	pickerSelection = (title, key) => {
		const { preferences } = this.state;
		const { navigation } = this.props;
		let values = OPTIONS[key];
		if (OPTIONS[key][0]?.value !== 'default') {
			values = [{ label: `${ I18n.t('Default') } (${ I18n.t(this.findOption(key).label) })`, value: preferences[key]?.value }, ...OPTIONS[key]];
		}
		navigation.navigate('PickerView', {
			title,
			data: values,
			value: preferences[key],
			onChangeValue: value => this.onValueChangePicker(key, value)
		});
	}

	onValueChangePicker = (key, value) => this.saveNotificationPreferences({ [key]: value.toString() });

	saveNotificationPreferences = async(params) => {
		const { user } = this.props;
		const { id } = user;
		const result = await RocketChat.setUserPreferences(id, params);
		const { user: { settings } } = result;
		this.setState({ preferences: settings.preferences });
	}

	render() {
		const { theme } = this.props;
		const { loading } = this.state;
		return (
			<SafeAreaView testID='user-notification-preference-view'>
				<StatusBar />
				<List.Container>
					{loading
						? (
							<>
								<List.Section title='Desktop_Notifications'>
									<List.Separator />
									<List.Item
										title='Alert'
										testID='user-notification-preference-view-alert'
										onPress={title => this.pickerSelection(title, 'desktopNotifications')}
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
										onPress={title => this.pickerSelection(title, 'mobileNotifications')}
										right={() => this.renderPickerOption('mobileNotifications')}
									/>
									<List.Separator />
									<List.Info info='Push_Notifications_Alert_Info' />
								</List.Section>

								<List.Section title='Email'>
									<List.Separator />
									<List.Item
										title='Alert'
										testID='user-notification-preference-view-email-alert'
										onPress={title => this.pickerSelection(title, 'emailNotificationMode')}
										right={() => this.renderPickerOption('emailNotificationMode')}
									/>
									<List.Separator />
									<List.Info info='You_need_to_verifiy_your_email_address_to_get_notications' />
								</List.Section>
							</>
						) : <ActivityIndicator theme={theme} />
					}
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(UserNotificationPreferencesView));
