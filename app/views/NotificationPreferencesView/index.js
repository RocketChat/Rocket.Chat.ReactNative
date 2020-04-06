import React from 'react';
import {
	View, ScrollView, Switch, Text
} from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';

import database from '../../lib/database';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';
import sharedStyles from '../Styles';
import RocketChat from '../../lib/rocketchat';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';

const SectionTitle = React.memo(({ title, theme }) => (
	<Text
		style={[
			styles.sectionTitle,
			{
				backgroundColor: themes[theme].auxiliaryBackground,
				color: themes[theme].infoText
			}
		]}
	>
		{title}
	</Text>
));

const SectionSeparator = React.memo(({ theme }) => (
	<View
		style={[
			styles.sectionSeparatorBorder,
			{ backgroundColor: themes[theme].auxiliaryBackground }
		]}
	/>
));

const Info = React.memo(({ info, theme }) => (
	<Text
		style={[
			styles.infoText,
			{
				color: themes[theme].infoText,
				backgroundColor: themes[theme].auxiliaryBackground
			}
		]}
	>
		{info}
	</Text>
));

SectionTitle.propTypes = {
	title: PropTypes.string,
	theme: PropTypes.string
};

SectionSeparator.propTypes = {
	theme: PropTypes.string
};

Info.propTypes = {
	info: PropTypes.string,
	theme: PropTypes.string
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

class NotificationPreferencesView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Notification_Preferences'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	};

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

	saveNotificationSettings = async(key, value, params) => {
		const { room } = this.state;
		const db = database.active;

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
		return <Text style={[styles.pickerText, { color: themes[theme].actionTintColor }]}>{text?.label}</Text>;
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
		const { theme } = this.props;
		return (
			<SafeAreaView style={sharedStyles.container} testID='notification-preference-view' forceInset={{ vertical: 'never' }}>
				<StatusBar theme={theme} />
				<ScrollView
					{...scrollPersistTaps}
					style={{ backgroundColor: themes[theme].auxiliaryBackground }}
					contentContainerStyle={styles.contentContainer}
					testID='notification-preference-view-list'
				>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Receive_Notification')}
						testID='notification-preference-view-receive-notification'
						right={() => this.renderSwitch('disableNotifications')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<Info info={I18n.t('Receive_notifications_from', { name: room.name })} theme={theme} />
					<SectionSeparator theme={theme} />

					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Receive_Group_Mentions')}
						testID='notification-preference-view-group-mentions'
						right={() => this.renderSwitch('muteGroupMentions')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<Info info={I18n.t('Receive_Group_Mentions_Info')} theme={theme} />

					<SectionSeparator theme={theme} />
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Show_Unread_Counter')}
						testID='notification-preference-view-unread-count'
						right={() => this.renderSwitch('hideUnreadStatus')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<Info info={I18n.t('Show_Unread_Counter_Info')} theme={theme} />

					<SectionSeparator theme={theme} />
					<SectionTitle title={I18n.t('IN_APP_AND_DESKTOP')} theme={theme} />
					<Separator theme={theme} />

					<ListItem
						title={I18n.t('Alert')}
						testID='notification-preference-view-alert'
						onPress={title => this.pickerSelection(title, 'desktopNotifications')}
						right={() => this.renderPickerOption('desktopNotifications')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<Info info={I18n.t('In_App_and_Desktop_Alert_info')} theme={theme} />

					<SectionSeparator theme={theme} />
					<SectionTitle title={I18n.t('PUSH_NOTIFICATIONS')} theme={theme} />
					<Separator theme={theme} />

					<ListItem
						title={I18n.t('Alert')}
						testID='notification-preference-view-push-notification'
						onPress={title => this.pickerSelection(title, 'mobilePushNotifications')}
						right={() => this.renderPickerOption('mobilePushNotifications')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<Info info={I18n.t('Push_Notifications_Alert_Info')} theme={theme} />

					<SectionSeparator theme={theme} />
					<SectionTitle title={I18n.t('DESKTOP_OPTIONS')} theme={theme} />
					<Separator theme={theme} />

					<ListItem
						title={I18n.t('Audio')}
						testID='notification-preference-view-audio'
						onPress={title => this.pickerSelection(title, 'audioNotifications')}
						right={() => this.renderPickerOption('audioNotifications')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Sound')}
						testID='notification-preference-view-sound'
						onPress={title => this.pickerSelection(title, 'audioNotificationValue')}
						right={() => this.renderPickerOption('audioNotificationValue')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Notification_Duration')}
						testID='notification-preference-view-notification-duration'
						onPress={title => this.pickerSelection(title, 'desktopNotificationDuration')}
						right={() => this.renderPickerOption('desktopNotificationDuration')}
						theme={theme}
					/>
					<Separator theme={theme} />

					<SectionSeparator theme={theme} />
					<SectionTitle title={I18n.t('EMAIL')} theme={theme} />
					<Separator theme={theme} />

					<ListItem
						title={I18n.t('Alert')}
						testID='notification-preference-view-email-alert'
						onPress={title => this.pickerSelection(title, 'emailNotifications')}
						right={() => this.renderPickerOption('emailNotifications')}
						theme={theme}
					/>
					<Separator theme={theme} />

					<View style={[styles.marginBottom, { backgroundColor: themes[theme].auxiliaryBackground }]} />
				</ScrollView>
			</SafeAreaView>
		);
	}
}

export default withTheme(NotificationPreferencesView);
