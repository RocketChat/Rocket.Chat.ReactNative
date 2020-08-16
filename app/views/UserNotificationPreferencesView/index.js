import React from 'react';
import {
	View, ScrollView, Switch, Text
} from 'react-native';
import PropTypes from 'prop-types';

import database from '../../lib/database';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';
import RocketChat from '../../lib/rocketchat';
import { withTheme } from '../../theme';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import SafeAreaView from '../../containers/SafeAreaView';
import log, { events, logEvent } from '../../utils/log';
import SectionTitle from '../NotificationPreferencesView/SectionTitle';
import SectionSeparator from '../NotificationPreferencesView/SectionSeparator';
import Info from '../NotificationPreferencesView/Info';
import { OPTIONS } from './options';

class UserNotificationPreferencesView extends React.Component {
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
		const preferences = props.route.params?.preferences;
		this.state = {
			preferences: preferences || {},
		};
	}

	findOption = (key) => {
		const { preferences } = this.state;
		const option = preferences[key] ? OPTIONS[key].find(option => option.value === preferences[key]) : OPTIONS[key][0];
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
		if ( OPTIONS[key][0].value !== 'default') {
			values = [{label: `${I18n.t('Default')} (${I18n.t(this.findOption(key).label)})`, value: preferences[key].value}, ...OPTIONS[key]]
		}
		navigation.navigate('PickerView', {
			title,
			data: values,
			value: preferences[key],
			onChangeValue: value => this.onValueChangePicker(key, value)
		});
	}

	onValueChangePicker = (key, value) => this.saveNotificationSettings(key, value, { [key]: value.toString() });

	saveNotificationSettings = async (key, value, params) => {
		/* 		logEvent(events[`NP_${key.toUpperCase()}`]);
				const { room } = this.state;
				const db = database.active;
		
				try {
					await db.action(async () => {
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
		
					await db.action(async () => {
						await room.update(protectedFunction((r) => {
							r[key] = room[key];
						}));
					});
				} catch (e) {
					logEvent(events[`NP_${key.toUpperCase()}_F`]);
					log(e);
				} */
	}

	render() {
		const { room, user } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView testID='user-notification-preference-view' theme={theme}>
				<StatusBar theme={theme} />
				<ScrollView
					{...scrollPersistTaps}
					style={{ backgroundColor: themes[theme].auxiliaryBackground }}
					contentContainerStyle={styles.contentContainer}
					testID='user-notification-preference-view-list'
				>
					<SectionTitle title={I18n.t('IN_APP_AND_DESKTOP')} theme={theme} />
					<Separator theme={theme} />

					<ListItem
						title={I18n.t('Alert')}
						testID='user-notification-preference-view-alert'
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
						testID='user-notification-preference-view-push-notification'
						onPress={title => this.pickerSelection(title, 'mobileNotifications')}
						right={() => this.renderPickerOption('mobileNotifications')}
						theme={theme}
					/>
					<Separator theme={theme} />
					<Info info={I18n.t('Push_Notifications_Alert_Info')} theme={theme} />

					<SectionSeparator theme={theme} />
					<SectionTitle title={I18n.t('EMAIL')} theme={theme} />
					<Separator theme={theme} />

					<ListItem
						title={I18n.t('Alert')}
						testID='user-notification-preference-view-email-alert'
						onPress={title => this.pickerSelection(title, 'emailNotificationMode')}
						right={() => this.renderPickerOption('emailNotificationMode')}
						theme={theme}
					/>

					<Separator theme={theme} />
					<Info info={I18n.t('You_need_to_verifiy_your_email_address_to_get_notications')} theme={theme} />

					<View style={[styles.marginBottom, { backgroundColor: themes[theme].auxiliaryBackground }]} />
				</ScrollView>
			</SafeAreaView>
		)
	};
}

export default withTheme(UserNotificationPreferencesView);
