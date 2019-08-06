import React from 'react';
import {
	View, ScrollView, SafeAreaView, Switch, Text, Picker
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { SWITCH_TRACK_COLOR } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
// import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';
import sharedStyles from '../Styles';
import database from '../../lib/realm';

const SectionTitle = React.memo(({ title }) => (<Text style={styles.sectionTitle}> {title}</Text>
));

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
			label: 'AllAll Messages',
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
		this.state = {
			room: JSON.parse(JSON.stringify(this.rooms[0] || {}))
		};
	}

	renderSwitch = (key) => {
		const { room } = this.state;
		return (
			<Switch
				value={room[key]}
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
			<Picker
				selectedValue={room[key]}
				onValueChange={value => this.onValueChange(key, value)}
			>
				{OPTIONS[key].map(item => (
					<Picker.Item label={item.label} value={item.value} />
				))}
			</Picker>
		);
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
						right={() => this.renderSwitch('desktopNotifications')}
					/>
					<Info info='Displays a banner at the top of the screen when app is open, and displays a notification on desktop' />

					<SectionSeparator />
					<SectionTitle title='PUSH NOTIFICATIONS' />

					<ListItem
						title='Alert'
						testID='notificationPref-view-alert'
						right={() => this.renderSwitch('mobilePushNotifications')}
					/>
					<Info info='These notifications are delivered to you when the app is not open' />

					<SectionSeparator />
					<SectionTitle title='DESKTOP OPTIONS' />

					<ListItem
						title='Audio'
						testID='notificationPref-view-alert'
						right={() => this.renderSwitch('audioNotifications')}
					/>
					<Separator />
					<ListItem
						title='Sound'
						testID='notificationPref-view-alert'
					/>
					<Separator />
					<ListItem
						title='Notification Duration'
						testID='notificationPref-view-alert'
					/>

					<SectionSeparator />
					<SectionTitle title='EMAIL' />

					<ListItem
						title='Alert'
						testID='notificationPref-view-alert'
						right={() => this.renderSwitch('emailNotifications')}
					/>
				</ScrollView>
			</SafeAreaView>
		);
	}
}
