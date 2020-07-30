import React from 'react';
import {
	View, Linking, ScrollView, Switch, Share, Clipboard
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import FastImage from '@rocket.chat/react-native-fast-image';

import { logout as logoutAction } from '../../actions/login';
import { selectServerRequest as selectServerRequestAction } from '../../actions/server';
import { toggleCrashReport as toggleCrashReportAction } from '../../actions/crashReport';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';
import { DrawerButton, CloseModalButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import ItemInfo from '../../containers/ItemInfo';
import { DisclosureImage } from '../../containers/DisclosureIndicator';
import Separator from '../../containers/Separator';
import I18n from '../../i18n';
import RocketChat, { CRASH_REPORT_KEY } from '../../lib/rocketchat';
import {
	getReadableVersion, getDeviceModel, isAndroid
} from '../../utils/deviceInfo';
import openLink from '../../utils/openLink';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert, showConfirmationAlert } from '../../utils/info';
import styles from './styles';
import {
	loggerConfig, analytics, logEvent, events
} from '../../utils/log';
import { PLAY_MARKET_LINK, APP_STORE_LINK, LICENSE_LINK } from '../../constants/links';
import { withTheme } from '../../theme';
import SidebarView from '../SidebarView';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import { appStart as appStartAction, ROOT_LOADING } from '../../actions/app';
import { onReviewPress } from '../../utils/review';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';

const SectionSeparator = React.memo(({ theme }) => (
	<View
		style={[
			styles.sectionSeparatorBorder,
			{
				borderColor: themes[theme].separatorColor,
				backgroundColor: themes[theme].auxiliaryBackground
			}
		]}
	/>
));
SectionSeparator.propTypes = {
	theme: PropTypes.string
};

class SettingsView extends React.Component {
	static navigationOptions = ({ navigation, isMasterDetail }) => ({
		headerLeft: () => (isMasterDetail ? (
			<CloseModalButton navigation={navigation} testID='settings-view-close' />
		) : (
			<DrawerButton navigation={navigation} />
		)),
		title: I18n.t('Settings')
	});

	static propTypes = {
		navigation: PropTypes.object,
		server:	PropTypes.object,
		allowCrashReport: PropTypes.bool,
		toggleCrashReport: PropTypes.func,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool,
		logout: PropTypes.func.isRequired,
		selectServerRequest: PropTypes.func,
		user: PropTypes.shape({
			roles: PropTypes.array,
			statusLivechat: PropTypes.string
		}),
		appStart: PropTypes.func
	}

	get showLivechat() {
		const { user } = this.props;
		const { roles } = user;

		return roles?.includes('livechat-agent');
	}

	handleLogout = () => {
		logEvent(events.SE_LOG_OUT);
		showConfirmationAlert({
			message: I18n.t('You_will_be_logged_out_of_this_application'),
			callToAction: I18n.t('Logout'),
			onPress: () => {
				const { logout } = this.props;
				logout();
			}
		});
	}

	handleClearCache = () => {
		logEvent(events.SE_CLEAR_LOCAL_SERVER_CACHE);
		showConfirmationAlert({
			message: I18n.t('This_will_clear_all_your_offline_data'),
			callToAction: I18n.t('Clear'),
			onPress: async() => {
				const {
					server: { server }, appStart, selectServerRequest
				} = this.props;
				appStart({ root: ROOT_LOADING, text: I18n.t('Clear_cache_loading') });
				await RocketChat.clearCache({ server });
				await FastImage.clearMemoryCache();
				await FastImage.clearDiskCache();
				selectServerRequest(server, null, true);
			}
		});
	}

	toggleCrashReport = (value) => {
		logEvent(events.SE_TOGGLE_CRASH_REPORT);
		AsyncStorage.setItem(CRASH_REPORT_KEY, JSON.stringify(value));
		const { toggleCrashReport } = this.props;
		toggleCrashReport(value);
		loggerConfig.autoNotify = value;
		analytics().setAnalyticsCollectionEnabled(value);
		if (value) {
			loggerConfig.clearBeforeSendCallbacks();
		} else {
			loggerConfig.registerBeforeSendCallback(() => false);
		}
	}

	toggleLivechat = async() => {
		try {
			await RocketChat.changeLivechatStatus();
		} catch {
			// Do nothing
		}
	}

	navigateToScreen = (screen) => {
		logEvent(events[`SE_NAVIGATE_TO_${ screen.replace('View', '').toUpperCase() }`]);
		const { navigation } = this.props;
		navigation.navigate(screen);
	}

	sendEmail = async() => {
		logEvent(events.SE_CONTACT_US);
		const subject = encodeURI('React Native App Support');
		const email = encodeURI('support@rocket.chat');
		const description = encodeURI(`
			version: ${ getReadableVersion }
			device: ${ getDeviceModel }
		`);
		try {
			await Linking.openURL(`mailto:${ email }?subject=${ subject }&body=${ description }`);
		} catch (e) {
			logEvent(events.SE_CONTACT_US_F);
			showErrorAlert(I18n.t('error-email-send-failed', { message: 'support@rocket.chat' }));
		}
	}

	shareApp = () => {
		logEvent(events.SE_SHARE_THIS_APP);
		Share.share({ message: isAndroid ? PLAY_MARKET_LINK : APP_STORE_LINK });
	}

	copyServerVersion = () => {
		const { server: { version } } = this.props;
		logEvent(events.SE_COPY_SERVER_VERSION, { serverVersion: version });
		this.saveToClipboard(version);
	}

	copyAppVersion = () => {
		logEvent(events.SE_COPY_APP_VERSION, { appVersion: getReadableVersion });
		this.saveToClipboard(getReadableVersion);
	}

	saveToClipboard = async(content) => {
		await Clipboard.setString(content);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	}

	onPressLicense = () => {
		logEvent(events.SE_READ_LICENSE);
		const { theme } = this.props;
		openLink(LICENSE_LINK, theme);
	}

	renderDisclosure = () => {
		const { theme } = this.props;
		return <DisclosureImage theme={theme} />;
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

	renderLivechatSwitch = () => {
		const { user } = this.props;
		const { statusLivechat } = user;
		return (
			<Switch
				value={statusLivechat === 'available'}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleLivechat}
			/>
		);
	}

	render() {
		const { server, isMasterDetail, theme } = this.props;
		return (
			<SafeAreaView testID='settings-view' theme={theme}>
				<StatusBar theme={theme} />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={styles.listPadding}
					showsVerticalScrollIndicator={false}
					testID='settings-view-list'
				>
					{isMasterDetail ? (
						<>
							<Separator theme={theme} />
							<SidebarView theme={theme} />
							<SectionSeparator theme={theme} />
							<ListItem
								title={I18n.t('Profile')}
								onPress={() => this.navigateToScreen('ProfileView')}
								showActionIndicator
								testID='settings-profile'
								right={this.renderDisclosure}
								theme={theme}
							/>
						</>
					) : null}

					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Contact_us')}
						onPress={this.sendEmail}
						showActionIndicator
						testID='settings-view-contact'
						right={this.renderDisclosure}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Language')}
						onPress={() => this.navigateToScreen('LanguageView')}
						showActionIndicator
						testID='settings-view-language'
						right={this.renderDisclosure}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Review_this_app')}
						showActionIndicator
						onPress={onReviewPress}
						testID='settings-view-review-app'
						right={this.renderDisclosure}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Share_this_app')}
						showActionIndicator
						onPress={this.shareApp}
						testID='settings-view-share-app'
						right={this.renderDisclosure}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Default_browser')}
						showActionIndicator
						onPress={() => this.navigateToScreen('DefaultBrowserView')}
						testID='settings-view-default-browser'
						right={this.renderDisclosure}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Theme')}
						showActionIndicator
						onPress={() => this.navigateToScreen('ThemeView')}
						testID='settings-view-theme'
						right={this.renderDisclosure}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Screen_lock')}
						showActionIndicator
						onPress={() => this.navigateToScreen('ScreenLockConfigView')}
						right={this.renderDisclosure}
						theme={theme}
					/>

					<SectionSeparator theme={theme} />

					<ListItem
						title={I18n.t('License')}
						onPress={this.onPressLicense}
						showActionIndicator
						testID='settings-view-license'
						right={this.renderDisclosure}
						theme={theme}
					/>

					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Version_no', { version: getReadableVersion })}
						onPress={this.copyAppVersion}
						testID='settings-view-version'
						theme={theme}
					/>
					<Separator theme={theme} />

					<ListItem
						title={I18n.t('Server_version', { version: server.version })}
						onPress={this.copyServerVersion}
						subtitle={`${ server.server.split('//')[1] }`}
						testID='settings-view-server-version'
						theme={theme}
					/>

					<SectionSeparator theme={theme} />

					{this.showLivechat ? (
						<>
							<ListItem
								title={I18n.t('Omnichannel')}
								testID='settings-view-livechat'
								right={() => this.renderLivechatSwitch()}
								theme={theme}
							/>
							<SectionSeparator theme={theme} />
						</>
					) : null}

					<ListItem
						title={I18n.t('Send_crash_report')}
						testID='settings-view-crash-report'
						right={() => this.renderCrashReportSwitch()}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ItemInfo
						info={I18n.t('Crash_report_disclaimer')}
						theme={theme}
					/>

					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Clear_cache')}
						testID='settings-clear-cache'
						onPress={this.handleClearCache}
						right={this.renderDisclosure}
						color={themes[theme].dangerColor}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Logout')}
						testID='settings-logout'
						onPress={this.handleLogout}
						right={this.renderDisclosure}
						color={themes[theme].dangerColor}
						theme={theme}
					/>
					<Separator theme={theme} />
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server,
	user: getUserSelector(state),
	allowCrashReport: state.crashReport.allowCrashReport,
	isMasterDetail: state.app.isMasterDetail
});

const mapDispatchToProps = dispatch => ({
	logout: () => dispatch(logoutAction()),
	selectServerRequest: params => dispatch(selectServerRequestAction(params)),
	toggleCrashReport: params => dispatch(toggleCrashReportAction(params)),
	appStart: params => dispatch(appStartAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SettingsView));
