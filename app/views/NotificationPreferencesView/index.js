import React from 'react';
import { Switch, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import database from '../../lib/database';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import { withTheme } from '../../theme';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import SafeAreaView from '../../containers/SafeAreaView';
import log, { events, logEvent } from '../../utils/log';
import { OPTIONS } from './options';
import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

class NotificationPreferencesView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Notification_Preferences')
	})

	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.mounted = false;
		this.rid = props.route.params?.rid;
		const room = props.route.params?.room;
		this.state = {
			room: room || {}
		};
		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable
				.subscribe((changes) => {
					if (this.mounted) {
						this.setState({ room: changes });
					} else {
						this.state.room = changes;
					}
				});
		}
	}

	componentDidMount() {
		this.mounted = true;
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	saveNotificationSettings = async(key, value, params) => {
		logEvent(events[`NP_${ key.toUpperCase() }`]);
		const { room } = this.state;
		const db = database.active;

		try {
			await db.action(async() => {
				await room.update(protectedFunction((r) => {
					r[key] = value;
				}));
			});

			try {
				const result = await RocketChat.saveNotificationSettings(this.rid, params);
				if (result.success) {
					return;
				}
			} catch {
				// do nothing
			}

			await db.action(async() => {
				await room.update(protectedFunction((r) => {
					r[key] = room[key];
				}));
			});
		} catch (e) {
			logEvent(events[`NP_${ key.toUpperCase() }_F`]);
			log(e);
		}
	}

	onValueChangeSwitch = (key, value) => this.saveNotificationSettings(key, value, { [key]: value ? '1' : '0' });

	onValueChangePicker = (key, value) => this.saveNotificationSettings(key, value, { [key]: value.toString() });

	pickerSelection = (title, key) => {
		const { room } = this.state;
		const { navigation } = this.props;
		navigation.navigate('PickerView', {
			title,
			data: OPTIONS[key],
			value: room[key],
			onChangeValue: value => this.onValueChangePicker(key, value)
		});
	}

	renderPickerOption = (key) => {
		const { room } = this.state;
		const { theme } = this.props;
		const text = room[key] ? OPTIONS[key].find(option => option.value === room[key]) : OPTIONS[key][0];
		return <Text style={[styles.pickerText, { color: themes[theme].actionTintColor }]}>{I18n.t(text?.label, { defaultValue: text?.label, second: text?.second })}</Text>;
	}

	renderSwitch = (key) => {
		const { room } = this.state;
		return (
			<Switch
				value={!room[key]}
				testID={key}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={value => this.onValueChangeSwitch(key, !value)}
			/>
		);
	}

	render() {
		const { room } = this.state;
		return (
			<SafeAreaView testID='notification-preference-view'>
				<StatusBar />
				<List.Container testID='notification-preference-view-list'>
					<List.Section>
						<List.Separator />
						<List.Item
							title='Receive_Notification'
							testID='notification-preference-view-receive-notification'
							right={() => this.renderSwitch('disableNotifications')}
						/>
						<List.Separator />
						<List.Info info={I18n.t('Receive_notifications_from', { name: room.name })} translateInfo={false} />
					</List.Section>

					<List.Section>
						<List.Separator />
						<List.Item
							title='Receive_Group_Mentions'
							testID='notification-preference-view-group-mentions'
							right={() => this.renderSwitch('muteGroupMentions')}
						/>
						<List.Separator />
						<List.Info info='Receive_Group_Mentions_Info' />
					</List.Section>

					<List.Section>
						<List.Separator />
						<List.Item
							title='Show_Unread_Counter'
							testID='notification-preference-view-unread-count'
							right={() => this.renderSwitch('hideUnreadStatus')}
						/>
						<List.Separator />
						<List.Info info='Show_Unread_Counter_Info' />
					</List.Section>

					<List.Section title='In_App_And_Desktop'>
						<List.Separator />
						<List.Item
							title='Alert'
							testID='notification-preference-view-alert'
							onPress={title => this.pickerSelection(title, 'desktopNotifications')}
							right={() => this.renderPickerOption('desktopNotifications')}
						/>
						<List.Separator />
						<List.Info info='In_App_and_Desktop_Alert_info' />
					</List.Section>

					<List.Section title='Push_Notifications'>
						<List.Separator />
						<List.Item
							title='Alert'
							testID='notification-preference-view-push-notification'
							onPress={title => this.pickerSelection(title, 'mobilePushNotifications')}
							right={() => this.renderPickerOption('mobilePushNotifications')}
						/>
						<List.Separator />
						<List.Info info='Push_Notifications_Alert_Info' />
					</List.Section>

					<List.Section title='Desktop_Options'>
						<List.Separator />
						<List.Item
							title='Audio'
							testID='notification-preference-view-audio'
							onPress={title => this.pickerSelection(title, 'audioNotifications')}
							right={() => this.renderPickerOption('audioNotifications')}
						/>
						<List.Separator />
						<List.Item
							title='Sound'
							testID='notification-preference-view-sound'
							onPress={title => this.pickerSelection(title, 'audioNotificationValue')}
							right={() => this.renderPickerOption('audioNotificationValue')}
						/>
						<List.Separator />
						<List.Item
							title='Notification_Duration'
							testID='notification-preference-view-notification-duration'
							onPress={title => this.pickerSelection(title, 'desktopNotificationDuration')}
							right={() => this.renderPickerOption('desktopNotificationDuration')}
						/>
						<List.Separator />
					</List.Section>

					<List.Section title='Email'>
						<List.Separator />
						<List.Item
							title='Alert'
							testID='notification-preference-view-email-alert'
							onPress={title => this.pickerSelection(title, 'emailNotifications')}
							right={() => this.renderPickerOption('emailNotifications')}
						/>
						<List.Separator />
					</List.Section>
				</List.Container>
			</SafeAreaView>
		);
	}
}

export default withTheme(NotificationPreferencesView);
