import React from 'react';
import {
	View, ScrollView, Text
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';
import RocketChat from '../../lib/rocketchat';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import SectionTitle from './SectionTitle';
import SectionSeparator from './SectionSeparator';
import Info from './Info';
import { OPTIONS } from './options';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { DisclosureImage } from '../../containers/DisclosureIndicator';
import { getUserSelector } from '../../selectors/login';

class UserNotificationPreferencesView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Notification_Preferences')
	})

	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
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

	renderDisclosure = () => {
		const { theme } = this.props;
		return <DisclosureImage theme={theme} />;
	}

	render() {
		const { theme } = this.props;
		const { loading } = this.state;
		return (
			<SafeAreaView testID='user-notification-preference-view' theme={theme}>
				<StatusBar theme={theme} />
				<ScrollView
					{...scrollPersistTaps}
					style={{ backgroundColor: themes[theme].auxiliaryBackground }}
					contentContainerStyle={styles.contentContainer}
					testID='user-notification-preference-view-list'
				>
					{loading
						? (
							<>
								<SectionSeparator theme={theme} />
								<SectionTitle title={I18n.t('DESKTOP_NOTIFICATIONS')} theme={theme} />

								<ListItem
									title={I18n.t('Alert')}
									testID='user-notification-preference-view-alert'
									onPress={title => this.pickerSelection(title, 'desktopNotifications')}
									right={() => this.renderPickerOption('desktopNotifications')}
									theme={theme}
								/>
								<Separator theme={theme} />
								<Info info={I18n.t('Desktop_Alert_info')} theme={theme} />

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
							</>
						) : <ActivityIndicator theme={theme} />
					}
					<View style={[styles.marginBottom, { backgroundColor: themes[theme].auxiliaryBackground }]} />
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(UserNotificationPreferencesView));
