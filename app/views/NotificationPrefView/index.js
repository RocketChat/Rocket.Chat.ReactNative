import React from 'react';
import {
	View, ScrollView, SafeAreaView, Switch, Text, Keyboard, TouchableOpacity
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
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
import { showErrorAlert } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import EventEmitter from '../../utils/events';
import { LISTENER } from '../../containers/Toast';
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
	desktopNotifications: [
		{
			label: 'Default',
			value: 'default'
		},
		{
			label: 'All Messages',
			value: 'all'
		},
		{
			label: 'Mentions',
			value: 'mentions'
		},
		{
			label: 'Nothing',
			value: 'nothing'
		}
	],
	audioNotifications: [
		{
			label: 'Default',
			value: 'default'
		},
		{
			label: 'All Messages',
			value: 'all'
		},
		{
			label: 'Mentions',
			value: 'mentions'
		},
		{
			label: 'Nothing',
			value: 'nothing'
		}
	],
	mobilePushNotifications: [
		{
			label: 'Default',
			value: 'default'
		},
		{
			label: 'All Messages',
			value: 'all'
		},
		{
			label: 'Mentions',
			value: 'mentions'
		},
		{
			label: 'Nothing',
			value: 'nothing'
		}
	],
	emailNotifications: [
		{
			label: 'Default',
			value: 'default'
		},
		{
			label: 'All Messages',
			value: 'all'
		},
		{
			label: 'Mentions',
			value: 'mentions'
		},
		{
			label: 'Nothing',
			value: 'nothing'
		}
	],
	desktopNotificationDuration: [
		{
			label: 'Default',
			value: 0
		},
		{
			label: '1 second',
			value: 1
		},
		{
			label: '2 seconds',
			value: 2
		},
		{
			label: '3 seconds',
			value: 3
		},
		{
			label: '4 seconds',
			value: 4
		},
		{
			label: '5 seconds',
			value: 5
		}
	],
	audioNotificationValue: [
		{
			label: 'None',
			value: 'none None'
		},
		{
			label: 'Default',
			value: '0 Default'
		},
		{
			label: 'Beep',
			value: 'beep Beep'
		},
		{
			label: 'Ding',
			value: 'ding Ding'
		},
		{
			label: 'Chelle',
			value: 'chelle Chelle'
		},
		{
			label: 'Droplet',
			value: 'droplet Droplet'
		},
		{
			label: 'Highbell',
			value: 'highbell Highbell'
		},
		{
			label: 'Seasons',
			value: 'seasons Seasons'
		}
	]

};

@connect(state => ({
	server: state.server
}))
export default class NotificationPrefView extends React.Component {
	static navigationOptions = () => ({
		title: 'Notification Preferences'
	})

	static propTypes = {
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.rid = props.navigation.getParam('rid');
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.room = JSON.parse(JSON.stringify(this.rooms[0] || {}));
		log('room', this.room);
		this.state = {
			room: JSON.parse(JSON.stringify(this.rooms[0] || {}))
		};
	}

	renderSwitch = (key) => {
		const { room } = this.state;
		return (
			<Switch
				value={key === 'disableNotifications' ? !room[key] : room[key]}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={value => this.onValueChange(key, value)}
			/>
		);
	}

	onValueChange = (key, value) => {
		const { room: newRoom } = this.state;
		newRoom[key] = value;
		this.setState({ room: newRoom });
	}

	renderPicker = (key) => {
		const { room } = this.state;
		return (
			<RNPickerSelect
				value={room[key]}
				onValueChange={value => this.onValueChange(key, value)}
				items={OPTIONS[key]}
			/>
		);
	}

	formIsChanged = () => {
		const { room } = this.state;
		const {
			emailNotifications, disableNotifications, muteGroupMentions, hideUnreadStatus, audioNotifications, audioNotificationValue, desktopNotificationDuration, mobilePushNotifications
		} = room;
		return !(this.room.emailNotifications === emailNotifications
			&& this.room.disableNotifications === disableNotifications
			&& this.room.muteGroupMentions === muteGroupMentions
			&& this.room.hideUnreadStatus === hideUnreadStatus
			&& this.room.mobilePushNotifications === mobilePushNotifications
			&& this.room.audioNotifications === audioNotifications
			&& this.room.audioNotificationValue === audioNotificationValue
			&& this.room.desktopNotificationDuration === desktopNotificationDuration
		);
	}

	Icon = () => {

	}

	submit = async() => {
		Keyboard.dismiss();
		if (!this.formIsChanged()) {
			showErrorAlert(I18n.t('Nothing_to_save'));
			return;
		}

		const { room } = this.state;
		const {
			emailNotifications, disableNotifications, muteGroupMentions, hideUnreadStatus, audioNotifications, audioNotificationValue, desktopNotificationDuration, mobilePushNotifications
		} = room;
		const params = {};

		if (this.room.emailNotifications !== emailNotifications) {
			params.emailNotifications = emailNotifications.toString();
		}
		if (this.room.disableNotifications !== disableNotifications) {
			params.disableNotifications = disableNotifications.toString();
		}
		if (this.room.muteGroupMentions !== muteGroupMentions) {
			params.muteGroupMentions = muteGroupMentions.toString();
		}
		if (this.room.hideUnreadStatus !== hideUnreadStatus) {
			params.hideUnreadStatus = hideUnreadStatus.toString();
		}
		if (this.room.audioNotifications !== audioNotifications) {
			params.audioNotifications = audioNotifications.toString();
		}
		if (this.room.mobilePushNotifications !== mobilePushNotifications) {
			params.mobilePushNotifications = mobilePushNotifications.toString();
		}
		if (this.room.desktopNotificationDuration !== desktopNotificationDuration) {
			try {
				await RocketChat.saveDesktopNotificationDuration(this.rid, desktopNotificationDuration);
			} catch (err) {
				log('err_save_desktop_notification_duration', err);
			}
		}
		if (this.room.audioNotificationValue !== audioNotificationValue) {
			try {
				await RocketChat.saveAudioNotificationValue(this.rid, audioNotificationValue);
			} catch (err) {
				log('err_save_audio_notification_value', err);
			}
		}
		if (Object.keys(params).length > 0) {
			try {
				await RocketChat.saveNotificationSettings(this.rid, params);
			} catch (err) {
				log('err_save_notification_settings', err);
			}
		}
		EventEmitter.emit(LISTENER, { message: I18n.t('Settings_succesfully_changed') });
	}


	render() {
		return (
			<SafeAreaView style={sharedStyles.listSafeArea} testID='notificationPref-view'>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={sharedStyles.listContentContainer}
					showsVerticalScrollIndicator={false}
					testID='notificationPref-view-list'
				>
					<ListItem
						title='Receive Notification'
						testID='notificationPref-view-receiveNotification'
						right={() => this.renderSwitch('disableNotifications')}
					/>
					<Info info='Receive notifications from pranav padney' />
					<SectionSeparator />

					<ListItem
						title='Show Unread Counter'
						testID='notificationPref-view-unreadCount'
						right={() => this.renderSwitch('hideUnreadStatus')}
					/>
					<Info info='Unread counter is displayed as a badge on the right of the channel,in the list' />

					<SectionSeparator />
					<SectionTitle title='IN-APP AND DESKTOP' />

					<ListItem
						title='Alert'
						testID='notificationPref-view-alert'
						right={() => this.renderPicker('desktopNotifications')}
					/>
					<Info info='Displays a banner at the top of the screen when app is open, and displays a notification on desktop' />

					<SectionSeparator />
					<SectionTitle title='PUSH NOTIFICATIONS' />

					<ListItem
						title='Alert'
						testID='notificationPref-view-alert'
						right={() => this.renderPicker('mobilePushNotifications')}
					/>
					<Info info='These notifications are delivered to you when the app is not open' />

					<SectionSeparator />
					<SectionTitle title='DESKTOP OPTIONS' />

					<ListItem
						title='Audio'
						testID='notificationPref-view-alert'
						right={() => this.renderPicker('audioNotifications')}
					/>
					<Separator />
					<ListItem
						title='Sound'
						testID='notificationPref-view-alert'
						right={() => this.renderPicker('audioNotificationValue')}
					/>
					<Separator />
					<ListItem
						title='Notification Duration'
						testID='notificationPref-view-alert'
						right={() => this.renderPicker('desktopNotificationDuration')}
					/>

					<SectionSeparator />
					<SectionTitle title='EMAIL' />

					<ListItem
						title='Alert'
						testID='notificationPref-view-alert'
						right={() => this.renderPicker('emailNotifications')}
					/>
					<View
						style={styles.container}
					>
						<TouchableOpacity
							style={[styles.buttonContainer, !this.formIsChanged() && styles.buttonContainerDisabled]}
							onPress={this.submit}
							disabled={!this.formIsChanged()}
							testID='room-info-edit-view-submit'
						>
							<Text style={sharedStyles.button} accessibilityTraits='button'>{I18n.t('SAVE')}</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}
