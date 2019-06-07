import React from 'react';
import {
	View, Linking, ScrollView, AsyncStorage, SafeAreaView
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import firebase from 'react-native-firebase';

import { DrawerButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { getReadableVersion, getDeviceModel } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import { MARKDOWN_KEY } from '../../lib/rocketchat';
import styles from './styles';
import openLink from '../../utils/openLink';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { toggleMarkdown as toggleMarkdownAction } from '../../actions/markdown';
import Button from './Button';
import ButtonWithSwitch from './ButtonWithSwitch';
import InfoButton from './InfoButton';
import { showErrorAlert } from '../../utils/info';

const LICENSE_LINK = 'https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/LICENSE';

@connect(state => ({
	server: state.server,
	useMarkdown: state.markdown.useMarkdown
}), dispatch => ({
	toggleMarkdown: params => dispatch(toggleMarkdownAction(params))
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
		toggleMarkdown: PropTypes.func
	}

	toggleMarkdown = (value) => {
		AsyncStorage.setItem(MARKDOWN_KEY, JSON.stringify(value));
		const { toggleMarkdown } = this.props;
		toggleMarkdown(value);
		firebase.analytics().logEvent.logCustom('toggle_markdown', { value });
	}

	navigateToRoom = (room) => {
		const { navigation } = this.props;
		return () => navigation.navigate(room);
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

	openLink = link => openLink(link)

	renderSectionSeparator = () => <View style={styles.sectionSeparatorBorder} />;

	renderSeparator = () => <View style={styles.separator} />;

	/* renderCrashReportDisclaimer = () => (
		<View style={[styles.sectionItem, styles.sectionItemDisabled]}>
			<Text style={styles.sectionItemTitle}>{I18n.t('Crash_report_disclaimer')}</Text>
		</View>
	) */

	render() {
		const { server, useMarkdown } = this.props;
		return (
			<SafeAreaView style={styles.container} testID='settings-view'>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
					testID='settings-view-list'
				>
					<Button title={I18n.t('Contact_us')} onPress={this.sendEmail} showActionIndicator testID='settings-view-contact' />
					{this.renderSeparator()}
					<Button title={I18n.t('Language')} onPress={this.navigateToRoom('LanguageView')} showActionIndicator testID='settings-view-language' />
					{this.renderSeparator()}
					<Button title={I18n.t('Theme')} showActionIndicator disable testID='settings-view-theme' />
					{this.renderSeparator()}
					<Button title={I18n.t('Share_this_app')} showActionIndicator disable testID='settings-view-share-app' />

					{this.renderSectionSeparator()}

					<Button title={I18n.t('License')} onPress={() => this.openLink(LICENSE_LINK)} showActionIndicator testID='settings-view-license' />
					{this.renderSeparator()}
					<InfoButton title={I18n.t('Version_no', { version: getReadableVersion })} testID='settings-view-version' />
					{this.renderSeparator()}
					<InfoButton title={I18n.t('Server_version', { version: server.version })} subTitle={`${ server.server.split('//')[1] }`} testID='settings-view-server-version' />

					{this.renderSectionSeparator()}

					<ButtonWithSwitch title={I18n.t('Enable_markdown')} value={useMarkdown} onValueChange={this.toggleMarkdown} testID='settings-view-markdown' />
				</ScrollView>
			</SafeAreaView>
		);
	}
}
