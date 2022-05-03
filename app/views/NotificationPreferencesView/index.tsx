import React from 'react';
import { StyleSheet, Switch, Text } from 'react-native';
import { RouteProp } from '@react-navigation/core';
import { StackNavigationProp } from '@react-navigation/stack';
import { Observable, Subscription } from 'rxjs';

import database from '../../lib/database';
import { SWITCH_TRACK_COLOR, themes } from '../../lib/constants';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import { TSupportedThemes, withTheme } from '../../theme';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import SafeAreaView from '../../containers/SafeAreaView';
import log, { events, logEvent } from '../../utils/log';
import sharedStyles from '../Styles';
import { IOptionsField, OPTIONS } from './options';
import { ChatsStackParamList } from '../../stacks/types';
import { IRoomNotifications, TRoomNotificationsModel } from '../../definitions';
import { Services } from '../../lib/services';

const styles = StyleSheet.create({
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

interface INotificationPreferencesViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'NotificationPrefView'>;
	route: RouteProp<ChatsStackParamList, 'NotificationPrefView'>;
	theme: TSupportedThemes;
}

interface INotificationPreferencesViewState {
	room: TRoomNotificationsModel;
}

class NotificationPreferencesView extends React.Component<INotificationPreferencesViewProps, INotificationPreferencesViewState> {
	static navigationOptions = () => ({
		title: I18n.t('Notification_Preferences')
	});

	private mounted: boolean;
	private rid: string;
	private roomObservable?: Observable<TRoomNotificationsModel>;
	private subscription?: Subscription;

	constructor(props: INotificationPreferencesViewProps) {
		super(props);
		this.mounted = false;
		this.rid = props.route.params?.rid ?? '';
		const room = props.route.params?.room;
		this.state = {
			room: room || {}
		};
		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable.subscribe(changes => {
				if (this.mounted) {
					this.setState({ room: changes });
				} else {
					// @ts-ignore
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

	saveNotificationSettings = async (key: string, value: string | boolean, params: IRoomNotifications) => {
		// @ts-ignore
		logEvent(events[`NP_${key.toUpperCase()}`]);
		const { room } = this.state;
		const db = database.active;

		try {
			await db.write(async () => {
				await room.update(
					protectedFunction((r: IRoomNotifications) => {
						r[key] = value;
					})
				);
			});

			try {
				const result = await Services.saveNotificationSettings(this.rid, params);
				if (result.success) {
					return;
				}
			} catch {
				// do nothing
			}

			await db.write(async () => {
				await room.update(
					protectedFunction((r: IRoomNotifications) => {
						r[key] = room[key];
					})
				);
			});
		} catch (e) {
			// @ts-ignore
			logEvent(events[`NP_${key.toUpperCase()}_F`]);
			log(e);
		}
	};

	onValueChangeSwitch = (key: string, value: string | boolean) =>
		this.saveNotificationSettings(key, value, { [key]: value ? '1' : '0' });

	onValueChangePicker = (key: string, value: string) => this.saveNotificationSettings(key, value, { [key]: value.toString() });

	pickerSelection = (title: string, key: string) => {
		const { room } = this.state;
		const { navigation } = this.props;
		navigation.navigate('PickerView', {
			title,
			data: OPTIONS[key],
			value: room[key],
			onChangeValue: (value: string) => this.onValueChangePicker(key, value)
		});
	};

	renderPickerOption = (key: string) => {
		const { room } = this.state;
		const { theme } = this.props;
		const text = room[key] ? OPTIONS[key].find(option => option.value === room[key]) : (OPTIONS[key][0] as IOptionsField);
		return (
			<Text style={[styles.pickerText, { color: themes[theme].actionTintColor }]}>
				{text?.label ? I18n.t(text?.label, { defaultValue: text?.label, second: text?.second }) : text?.label}
			</Text>
		);
	};

	renderSwitch = (key: string) => {
		const { room } = this.state;
		return (
			<Switch
				value={!room[key]}
				testID={key}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={value => this.onValueChangeSwitch(key, !value)}
			/>
		);
	};

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
							onPress={(title: string) => this.pickerSelection(title, 'desktopNotifications')}
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
							onPress={(title: string) => this.pickerSelection(title, 'mobilePushNotifications')}
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
							onPress={(title: string) => this.pickerSelection(title, 'audioNotifications')}
							right={() => this.renderPickerOption('audioNotifications')}
						/>
						<List.Separator />
						<List.Item
							title='Sound'
							testID='notification-preference-view-sound'
							onPress={(title: string) => this.pickerSelection(title, 'audioNotificationValue')}
							right={() => this.renderPickerOption('audioNotificationValue')}
						/>
						<List.Separator />
						<List.Item
							title='Notification_Duration'
							testID='notification-preference-view-notification-duration'
							onPress={(title: string) => this.pickerSelection(title, 'desktopNotificationDuration')}
							right={() => this.renderPickerOption('desktopNotificationDuration')}
						/>
						<List.Separator />
					</List.Section>

					<List.Section title='Email'>
						<List.Separator />
						<List.Item
							title='Alert'
							testID='notification-preference-view-email-alert'
							onPress={(title: string) => this.pickerSelection(title, 'emailNotifications')}
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
