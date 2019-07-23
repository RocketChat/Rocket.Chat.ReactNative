import React from 'react';
import {
	View, Linking, ScrollView, AsyncStorage, SafeAreaView, Switch, Text
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import firebase from 'react-native-firebase';

import { toggleMarkdown as toggleMarkdownAction } from '../../actions/markdown';
import { toggleCrashReport as toggleCrashReportAction } from '../../actions/crashReport';
import { SWITCH_TRACK_COLOR } from '../../constants/colors';
import { DrawerButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import { DisclosureImage } from '../../containers/DisclosureIndicator';
import Separator from '../../containers/Separator';
import I18n from '../../i18n';
import { MARKDOWN_KEY, CRASH_REPORT_KEY } from '../../lib/rocketchat';
import { getReadableVersion, getDeviceModel } from '../../utils/deviceInfo';
import openLink from '../../utils/openLink';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert } from '../../utils/info';
import styles from './styles';
import sharedStyles from '../Styles';

const LICENSE_LINK = 'https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/LICENSE';
const SectionSeparator = React.memo(() => <View style={styles.sectionSeparatorBorder} />);
const ItemInfo = React.memo(({ info }) => (
	<View style={styles.infoContainer}>
		<Text style={styles.infoText}>{info}</Text>
	</View>
));
ItemInfo.propTypes = {
	info: PropTypes.string
};

@connect(state => ({
	server: state.server,
	useMarkdown: state.markdown.useMarkdown,
	allowCrashReport: state.crashReport.allowCrashReport
}), dispatch => ({
	toggleMarkdown: params => dispatch(toggleMarkdownAction(params)),
	toggleCrashReport: params => dispatch(toggleCrashReportAction(params))
}))
export default class SettingsView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: <DrawerButton navigation={navigation} />,
		title: I18n.t('Settings')
	});

	static propTypes = {
		navigation: PropTypes.object,
		server:	PropTypes.object,
		useMarkdown: PropTypes.bool,
		allowCrashReport: PropTypes.bool,
		toggleMarkdown: PropTypes.func,
		toggleCrashReport: PropTypes.func
	}

	toggleMarkdown = (value) => {
		AsyncStorage.setItem(MARKDOWN_KEY, JSON.stringify(value));
		const { toggleMarkdown } = this.props;
		toggleMarkdown(value);
	}

	toggleCrashReport = (value) => {
		AsyncStorage.setItem(CRASH_REPORT_KEY, JSON.stringify(value));
		const { toggleCrashReport } = this.props;
		toggleCrashReport(value);
		if (value) {
			firebase.crashlytics().enableCrashlyticsCollection();
		}
	}

	navigateToRoom = (room) => {
		const { navigation } = this.props;
		navigation.navigate(room);
	}

	sendEmail = async() => {
		const subject = encodeURI('React Native App Support');
		const email = encodeURI('support@rocket.chat');
		const description = encodeURI(`
			version: ${ getReadableVersion }
			device: ${ getDeviceModel }
		`);
		try {
			await Linking.openURL(`mailto:${ email }?subject=${ subject }&body=${ description }`);
		} catch (e) {
			showErrorAlert(I18n.t('error-email-send-failed', { message: 'support@rocket.chat' }));
		}
	}

	onPressLicense = () => openLink(LICENSE_LINK)

	renderDisclosure = () => <DisclosureImage />

	renderMarkdownSwitch = () => {
		const { useMarkdown } = this.props;
		return (
			<Switch
				value={useMarkdown}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleMarkdown}
			/>
		);
	}

	renderCrashReportSwitch = () => {
		const { allowCrashReport } = this.props;
		return (
			<Switch
				value={allowCrashReport}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleCrashReport}
			/>
		);
	}

	render() {
		const { server } = this.props;
		return (
			<SafeAreaView style={sharedStyles.listSafeArea} testID='settings-view'>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={[sharedStyles.listContentContainer, styles.listWithoutBorderBottom]}
					showsVerticalScrollIndicator={false}
					testID='settings-view-list'
				>
					<ListItem
						title={I18n.t('Contact_us')}
						onPress={this.sendEmail}
						showActionIndicator
						testID='settings-view-contact'
						right={this.renderDisclosure}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Language')}
						onPress={() => this.navigateToRoom('LanguageView')}
						showActionIndicator
						testID='settings-view-language'
						right={this.renderDisclosure}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Theme')}
						showActionIndicator
						disabled
						testID='settings-view-theme'
					/>
					<Separator />
					<ListItem
						title={I18n.t('Share_this_app')}
						showActionIndicator
						disabled
						testID='settings-view-share-app'
					/>

					<SectionSeparator />

					<ListItem
						title={I18n.t('License')}
						onPress={this.onPressLicense}
						showActionIndicator
						testID='settings-view-license'
						right={this.renderDisclosure}
					/>
					<Separator />
					<ListItem title={I18n.t('Version_no', { version: getReadableVersion })} testID='settings-view-version' />
					<Separator />
					<ListItem
						title={I18n.t('Server_version', { version: server.version })}
						subtitle={`${ server.server.split('//')[1] }`}
						testID='settings-view-server-version'
					/>

					<SectionSeparator />

					<ListItem
						title={I18n.t('Enable_markdown')}
						testID='settings-view-markdown'
						right={() => this.renderMarkdownSwitch()}
					/>

					<SectionSeparator />

					<ListItem
						title={I18n.t('Send_crash_report')}
						testID='settings-view-crash-report'
						right={() => this.renderCrashReportSwitch()}
					/>
					<Separator />
					<ItemInfo
						info={I18n.t('Crash_report_disclaimer')}
					/>
				</ScrollView>
			</SafeAreaView>
		);
	}
}
