import React from 'react';
import {
	View, ScrollView, Switch, Text
} from 'react-native';
import PropTypes from 'prop-types';
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-navigation';

import { SWITCH_TRACK_COLOR } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';
import sharedStyles from '../Styles';
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
		label: I18n.t('Default'), value: 'default'
	}, {
		label: I18n.t('All_Messages'), value: 'all'
	}, {
		label: I18n.t('Mentions'), value: 'mentions'
	}, {
		label: I18n.t('Nothing'), value: 'nothing'
	}],
	audioNotifications: [{
		label: I18n.t('Default'), value: 'default'
	}, {
		label: I18n.t('All_Messages'), value: 'all'
	}, {
		label: I18n.t('Mentions'), value: 'mentions'
	}, {
		label: I18n.t('Nothing'), value: 'nothing'
	}],
	mobilePushNotifications: [{
		label: I18n.t('Default'), value: 'default'
	}, {
		label: I18n.t('All_Messages'), value: 'all'
	}, {
		label: I18n.t('Mentions'), value: 'mentions'
	}, {
		label: I18n.t('Nothing'), value: 'nothing'
	}],
	emailNotifications: [{
		label: I18n.t('Default'), value: 'default'
	}, {
		label: I18n.t('All_Messages'), value: 'all'
	}, {
		label: I18n.t('Mentions'), value: 'mentions'
	}, {
		label: I18n.t('Nothing'), value: 'nothing'
	}],
	desktopNotificationDuration: [{
		label: I18n.t('Default'), value: 0
	}, {
		label: I18n.t('Seconds', { second: 1 }), value: 1
	}, {
		label: I18n.t('Seconds', { second: 2 }), value: 2
	}, {
		label: I18n.t('Seconds', { second: 3 }), value: 3
	}, {
		label: I18n.t('Seconds', { second: 4 }), value: 4
	}, {
		label: I18n.t('Seconds', { second: 5 }), value: 5
	}],
	audioNotificationValue: [{
		label: 'None', value: 'none None'
	}, {
		label: I18n.t('Default'), value: '0 Default'
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
		this.mounted = false;
		this.rid = props.navigation.getParam('rid');
		const room = props.navigation.getParam('room');
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

	onValueChangeSwitch = async(key, value) => {
		const params = {
			[key]: value ? '1' : '0'
		};
		try {
			await RocketChat.saveNotificationSettings(this.rid, params);
		} catch (e) {
			log(e);
		}
	}

	onValueChangePicker = async(key, value) => {
		const params = {
			[key]: value.toString()
		};
		try {
			await RocketChat.saveNotificationSettings(this.rid, params);
		} catch (e) {
			log(e);
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
			<SafeAreaView style={sharedStyles.listSafeArea} testID='notification-preference-view' forceInset={{ vertical: 'never' }}>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
					testID='notification-preference-view-list'
				>
					<Separator />
					<ListItem
						title={I18n.t('Receive_Notification')}
						testID='notification-preference-view-receive-notification'
						right={() => this.renderSwitch('disableNotifications')}
					/>
					<Separator />
					<Info info={I18n.t('Receive_notifications_from', { name: room.name })} />
					<SectionSeparator />

					<Separator />
					<ListItem
						title={I18n.t('Receive_Group_Mentions')}
						testID='notification-preference-view-group-mentions'
						right={() => this.renderSwitch('muteGroupMentions')}
					/>
					<Separator />
					<Info info={I18n.t('Receive_Group_Mentions_Info')} />

					<SectionSeparator />
					<Separator />
					<ListItem
						title={I18n.t('Show_Unread_Counter')}
						testID='notification-preference-view-unread-count'
						right={() => this.renderSwitch('hideUnreadStatus')}
					/>
					<Separator />
					<Info info={I18n.t('Show_Unread_Counter_Info')} />

					<SectionSeparator />
					<SectionTitle title={I18n.t('IN_APP_AND_DESKTOP')} />
					<Separator />

					<ListItem
						title={I18n.t('Alert')}
						testID='notification-preference-view-alert'
						right={() => this.renderPicker('desktopNotifications')}
					/>
					<Separator />
					<Info info={I18n.t('In_App_and_Desktop_Alert_info')} />

					<SectionSeparator />
					<SectionTitle title={I18n.t('PUSH_NOTIFICATIONS')} />
					<Separator />

					<ListItem
						title={I18n.t('Alert')}
						testID='notification-preference-view-push-notification'
						right={() => this.renderPicker('mobilePushNotifications')}
					/>
					<Separator />
					<Info info={I18n.t('Push_Notifications_Alert_Info')} />

					<SectionSeparator />
					<SectionTitle title={I18n.t('DESKTOP_OPTIONS')} />
					<Separator />

					<ListItem
						title={I18n.t('Audio')}
						testID='notification-preference-view-audio'
						right={() => this.renderPicker('audioNotifications')}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Sound')}
						testID='notification-preference-view-sound'
						right={() => this.renderPicker('audioNotificationValue')}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Notification_Duration')}
						testID='notification-preference-view-notification-duration'
						right={() => this.renderPicker('desktopNotificationDuration')}
					/>
					<Separator />

					<SectionSeparator />
					<SectionTitle title={I18n.t('EMAIL')} />
					<Separator />

					<ListItem
						title={I18n.t('Alert')}
						testID='notification-preference-view-email-alert'
						right={() => this.renderPicker('emailNotifications')}
					/>
					<Separator />

					<View style={styles.marginBottom} />
				</ScrollView>
			</SafeAreaView>
		);
	}
}
