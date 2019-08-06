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
		title: I18n.t('Notification_Preference')
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
				testID={key}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={value => this.onValueChange(key, value)}
			/>
		);
	}

	onValueChange = (key, value) => {
		const { room: newRoom } = this.state;
		newRoom[key] = key === 'disableNotifications' ? !value : value;
		this.setState({ room: newRoom });
	}

	renderPicker = (key) => {
		const { room } = this.state;
		return (
			<RNPickerSelect
				testID={key}
				value={room[key]}
				textInputProps={{ style: { color: 'blue', paddingRight: 30 } }}
				useNativeAndroidPickerStyle={false}
				placeholder={{}}
				InputAccessoryView={() => null}
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
						title={I18n.t('Receive_Notification')}
						testID='notificationPref-view-receive-notification'
						right={() => this.renderSwitch('disableNotifications')}
					/>
					<Separator />
					<Info info={I18n.t('Receive_notification_from', { name: 'pranav pandey' })} />
					<SectionSeparator />

					<Separator />
					<ListItem
						title={I18n.t('Show_Unread_Counter')}
						testID='notificationPref-view-unread_count'
						right={() => this.renderSwitch('hideUnreadStatus')}
					/>
					<Separator />
					<Info info={I18n.t('Show_Unread_Counter_Info')} />

					<SectionSeparator />
					<SectionTitle title={I18n.t('IN_APP_AND_DESKTOP')} />

					<ListItem
						title={I18n.t('Alert')}
						testID='notificationPref-view-alert'
						right={() => this.renderPicker('desktopNotifications')}
					/>
					<Separator />
					<Info info={I18n.t('In_App_and_Desktop_Alert_info')} />

					<SectionSeparator />
					<SectionTitle title={I18n.t('Push_Notifications')} />

					<ListItem
						title={I18n.t('Alert')}
						testID='notificationPref-view-push-notification'
						right={() => this.renderPicker('mobilePushNotifications')}
					/>
					<Separator />
					<Info info={I18n.t('Push_Notifications_Alert_Info')} />

					<SectionSeparator />
					<SectionTitle title={I18n.t('Desktop_Options')} />

					<ListItem
						title={I18n.t('Audio')}
						testID='notificationPref-view-audio'
						right={() => this.renderPicker('audioNotifications')}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Sound')}
						testID='notificationPref-view-sound'
						right={() => this.renderPicker('audioNotificationValue')}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Notification_Duration')}
						testID='notificationPref-view-notification-duration'
						right={() => this.renderPicker('desktopNotificationDuration')}
					/>
					<Separator />

					<SectionSeparator />
					<SectionTitle title={I18n.t('Email')} />

					<ListItem
						title={I18n.t('Alert')}
						testID='notificationPref-view-email_alert'
						right={() => this.renderPicker('emailNotifications')}
					/>
					<Separator />

					<View
						style={styles.container}
					>
						<TouchableOpacity
							style={[styles.buttonContainer, !this.formIsChanged() && styles.buttonContainerDisabled]}
							onPress={this.submit}
							disabled={!this.formIsChanged()}
							testID='room-notification-edit-view-submit'
						>
							<Text style={sharedStyles.button} accessibilityTraits='button'>{I18n.t('SAVE')}</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}
