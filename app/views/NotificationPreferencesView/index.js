import React from 'react';
import {
	View, ScrollView, SafeAreaView, Switch, Text
} from 'react-native';
import PropTypes from 'prop-types';
import RNPickerSelect from 'react-native-picker-select';

import { SWITCH_TRACK_COLOR } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';
import sharedStyles from '../Styles';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';

const SectionTitle = React.memo(({ title }) => <Text style={styles.sectionTitle}>{title}</Text>);

const SectionSeparator = React.memo(() => <View style={styles.sectionSeparatorBorder} />);

const Info = React.memo(({ info }) => <Text style={styles.infoText}>{info}</Text>);

SectionTitle.propTypes = {
	title: PropTypes.string
};

Info.propTypes = {
	info: PropTypes.string
};

const OPTIONS = {
	desktopNotifications: [{
		label: 'Default', value: 'default'
	}, {
		label: 'All Messages', value: 'all'
	}, {
		label: 'Mentions', value: 'mentions'
	}, {
		label: 'Nothing', value: 'nothing'
	}],
	audioNotifications: [{
		label: 'Default', value: 'default'
	}, {
		label: 'All Messages', value: 'all'
	}, {
		label: 'Mentions', value: 'mentions'
	}, {
		label: 'Nothing', value: 'nothing'
	}],
	mobilePushNotifications: [{
		label: 'Default', value: 'default'
	}, {
		label: 'All Messages', value: 'all'
	}, {
		label: 'Mentions', value: 'mentions'
	}, {
		label: 'Nothing', value: 'nothing'
	}],
	emailNotifications: [{
		label: 'Default', value: 'default'
	}, {
		label: 'All Messages', value: 'all'
	}, {
		label: 'Mentions', value: 'mentions'
	}, {
		label: 'Nothing', value: 'nothing'
	}],
	desktopNotificationDuration: [{
		label: 'Default', value: 0
	}, {
		label: '1 second', value: 1
	}, {
		label: '2 seconds', value: 2
	}, {
		label: '3 seconds', value: 3
	}, {
		label: '4 seconds', value: 4
	}, {
		label: '5 seconds', value: 5
	}],
	audioNotificationValue: [{
		label: 'None', value: 'none None'
	}, {
		label: 'Default', value: '0 Default'
	}, {
		label: 'Beep', value: 'beep Beep'
	}, {
		label: 'Ding', value: 'ding Ding'
	}, {
		label: 'Chelle', value: 'chelle Chelle'
	}, {
		label: 'Droplet', value: 'droplet Droplet'
	}, {
		label: 'Highbell', value: 'highbell Highbell'
	}, {
		label: 'Seasons', value: 'seasons Seasons'
	}]
};

export default class NotificationPreferencesView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Notification_Preferences')
	})

	static propTypes = {
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.rid = props.navigation.getParam('rid');
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.state = {
			room: JSON.parse(JSON.stringify(this.rooms[0] || {}))
		};
	}

	onValueChangeSwitch = async(key, value) => {
		const { room: newRoom } = this.state;
		newRoom[key] = value;
		this.setState({ room: newRoom });
		const params = {
			[key]: value ? '1' : '0'
		};
		try {
			await RocketChat.saveNotificationSettings(this.rid, params);
		} catch (err) {
			log('err_save_notification_settings', err);
		}
	}

	onValueChangePicker = async(key, value) => {
		const { room: newRoom } = this.state;
		newRoom[key] = value;
		this.setState({ room: newRoom });
		const params = {
			[key]: value.toString()
		};
		try {
			await RocketChat.saveNotificationSettings(this.rid, params);
		} catch (err) {
			log('err_save_notification_settings', err);
		}
	}

	renderPicker = (key) => {
		const { room } = this.state;
		return (
			<RNPickerSelect
				testID={key}
				style={{ viewContainer: styles.viewContainer }}
				value={room[key]}
				textInputProps={{ style: styles.pickerText }}
				useNativeAndroidPickerStyle={false}
				placeholder={{}}
				onValueChange={value => this.onValueChangePicker(key, value)}
				items={OPTIONS[key]}
			/>
		);
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
			<SafeAreaView style={sharedStyles.listSafeArea} testID='notificationPreference-view'>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={sharedStyles.listContentContainer}
					showsVerticalScrollIndicator={false}
					testID='notificationPreference-view-list'
				>
					<ListItem
						title={I18n.t('Receive_Notification')}
						testID='notificationPreference-view-receive-notification'
						right={() => this.renderSwitch('disableNotifications')}
					/>
					<Separator />
					<Info info={I18n.t('Receive_notifications_from', { name: room.name })} />
					<SectionSeparator />

					<Separator />
					<ListItem
						title={I18n.t('Show_Unread_Counter')}
						testID='notificationPreference-view-unread_count'
						right={() => this.renderSwitch('hideUnreadStatus')}
					/>
					<Separator />
					<Info info={I18n.t('Show_Unread_Counter_Info')} />

					<SectionSeparator />
					<SectionTitle title={I18n.t('IN_APP_AND_DESKTOP')} />

					<ListItem
						title={I18n.t('Alert')}
						testID='notificationPreference-view-alert'
						right={() => this.renderPicker('desktopNotifications')}
					/>
					<Separator />
					<Info info={I18n.t('In_App_and_Desktop_Alert_info')} />

					<SectionSeparator />
					<SectionTitle title={I18n.t('Push_Notifications')} />

					<ListItem
						title={I18n.t('Alert')}
						testID='notificationPreference-view-push-notification'
						right={() => this.renderPicker('mobilePushNotifications')}
					/>
					<Separator />
					<Info info={I18n.t('Push_Notifications_Alert_Info')} />

					<SectionSeparator />
					<SectionTitle title={I18n.t('Desktop_Options')} />

					<ListItem
						title={I18n.t('Audio')}
						testID='notificationPreference-view-audio'
						right={() => this.renderPicker('audioNotifications')}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Sound')}
						testID='notificationPreference-view-sound'
						right={() => this.renderPicker('audioNotificationValue')}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Notification_Duration')}
						testID='notificationPreference-view-notification-duration'
						right={() => this.renderPicker('desktopNotificationDuration')}
					/>
					<Separator />

					<SectionSeparator />
					<SectionTitle title={I18n.t('Email')} />

					<ListItem
						title={I18n.t('Alert')}
						testID='notificationPreference-view-email_alert'
						right={() => this.renderPicker('emailNotifications')}
					/>
					<Separator />
				</ScrollView>
			</SafeAreaView>
		);
	}
}
