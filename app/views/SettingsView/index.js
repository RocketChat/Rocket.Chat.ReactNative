import React from 'react';
import {
	Linking, Switch, Share, Clipboard
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import FastImage from '@rocket.chat/react-native-fast-image';
import CookieManager from '@react-native-community/cookies';

import { logout as logoutAction } from '../../actions/login';
import { selectServerRequest as selectServerRequestAction } from '../../actions/server';
import { toggleCrashReport as toggleCrashReportAction, toggleAnalyticsEvents as toggleAnalyticsEventsAction } from '../../actions/crashReport';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import RocketChat, { CRASH_REPORT_KEY, ANALYTICS_EVENTS_KEY } from '../../lib/rocketchat';
import {
	getReadableVersion, getDeviceModel, isAndroid
} from '../../utils/deviceInfo';
import openLink from '../../utils/openLink';
import { showErrorAlert, showConfirmationAlert } from '../../utils/info';
import {
	loggerConfig, analytics, logEvent, events
} from '../../utils/log';
import {
	PLAY_MARKET_LINK, FDROID_MARKET_LINK, APP_STORE_LINK, LICENSE_LINK
} from '../../constants/links';
import { withTheme } from '../../theme';
import SidebarView from '../SidebarView';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import { appStart as appStartAction, ROOT_LOADING } from '../../actions/app';
import { onReviewPress } from '../../utils/review';
import SafeAreaView from '../../containers/SafeAreaView';
import database from '../../lib/database';
import { isFDroidBuild } from '../../constants/environment';
import { getUserSelector } from '../../selectors/login';

class SettingsView extends React.Component {
	static navigationOptions = ({ navigation, isMasterDetail }) => ({
		headerLeft: () => (isMasterDetail ? (
			<HeaderButton.CloseModal navigation={navigation} testID='settings-view-close' />
		) : (
			<HeaderButton.Drawer navigation={navigation} />
		)),
		title: I18n.t('Settings')
	});

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.object,
		allowCrashReport: PropTypes.bool,
		allowAnalyticsEvents: PropTypes.bool,
		toggleCrashReport: PropTypes.func,
		toggleAnalyticsEvents: PropTypes.func,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool,
		logout: PropTypes.func.isRequired,
		selectServerRequest: PropTypes.func,
		user: PropTypes.shape({
			roles: PropTypes.array,
			id: PropTypes.string
		}),
		appStart: PropTypes.func
	}

	checkCookiesAndLogout = async() => {
		const { logout, user } = this.props;
		const db = database.servers;
		const usersCollection = db.collections.get('users');
		try {
			const userRecord = await usersCollection.find(user.id);
			if (!userRecord.loginEmailPassword) {
				showConfirmationAlert({
					title: I18n.t('Clear_cookies_alert'),
					message: I18n.t('Clear_cookies_desc'),
					confirmationText: I18n.t('Clear_cookies_yes'),
					dismissText: I18n.t('Clear_cookies_no'),
					onPress: async() => {
						await CookieManager.clearAll(true);
						logout();
					},
					onCancel: () => {
						logout();
					}
				});
			} else {
				logout();
			}
		} catch {
			// Do nothing: user not found
		}
	}

	handleLogout = () => {
		logEvent(events.SE_LOG_OUT);
		showConfirmationAlert({
			message: I18n.t('You_will_be_logged_out_of_this_application'),
			confirmationText: I18n.t('Logout'),
			onPress: this.checkCookiesAndLogout
		});
	}

	handleClearCache = () => {
		logEvent(events.SE_CLEAR_LOCAL_SERVER_CACHE);
		showConfirmationAlert({
			message: I18n.t('This_will_clear_all_your_offline_data'),
			confirmationText: I18n.t('Clear'),
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
		if (!isFDroidBuild) {
			loggerConfig.autoNotify = value;
			if (value) {
				loggerConfig.clearBeforeSendCallbacks();
			} else {
				loggerConfig.registerBeforeSendCallback(() => false);
			}
		}
	}

	toggleAnalyticsEvents = (value) => {
		logEvent(events.SE_TOGGLE_ANALYTICS_EVENTS);
		const { toggleAnalyticsEvents } = this.props;
		AsyncStorage.setItem(ANALYTICS_EVENTS_KEY, JSON.stringify(value));
		toggleAnalyticsEvents(value);
		analytics().setAnalyticsCollectionEnabled(value);
	}

	navigateToScreen = (screen) => {
		logEvent(events[`SE_GO_${ screen.replace('View', '').toUpperCase() }`]);
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
		let message;
		if (isAndroid) {
			message = PLAY_MARKET_LINK;
			if (isFDroidBuild) {
				message = FDROID_MARKET_LINK;
			}
		} else {
			message = APP_STORE_LINK;
		}
		Share.share({ message });
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

	renderAnalyticsEventsSwitch = () => {
		const { allowAnalyticsEvents } = this.props;
		return (
			<Switch
				value={allowAnalyticsEvents}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleAnalyticsEvents}
			/>
		);
	}

	render() {
		const { server, isMasterDetail, theme } = this.props;
		return (
			<SafeAreaView testID='settings-view'>
				<StatusBar />
				<List.Container testID='settings-view-list'>
					{isMasterDetail ? (
						<>
							<List.Section>
								<List.Separator />
								<SidebarView />
								<List.Separator />
							</List.Section>
							<List.Section>
								<List.Separator />
								<List.Item
									title='Profile'
									onPress={() => this.navigateToScreen('ProfileView')}
									showActionIndicator
									testID='settings-profile'
								/>
								<List.Separator />
							</List.Section>
						</>
					) : null}

					<List.Section>
						<List.Separator />
						<List.Item
							title='Contact_us'
							onPress={this.sendEmail}
							showActionIndicator
							testID='settings-view-contact'
						/>
						<List.Separator />
						<List.Item
							title='Language'
							onPress={() => this.navigateToScreen('LanguageView')}
							showActionIndicator
							testID='settings-view-language'
						/>
						<List.Separator />
						{!isFDroidBuild ? (
							<>
								<List.Item
									title='Review_this_app'
									showActionIndicator
									onPress={onReviewPress}
									testID='settings-view-review-app'
								/>
							</>
						) : null}
						<List.Separator />
						<List.Item
							title='Share_this_app'
							showActionIndicator
							onPress={this.shareApp}
							testID='settings-view-share-app'
						/>
						<List.Separator />
						<List.Item
							title='Default_browser'
							showActionIndicator
							onPress={() => this.navigateToScreen('DefaultBrowserView')}
							testID='settings-view-default-browser'
						/>
						<List.Separator />
						<List.Item
							title='Theme'
							showActionIndicator
							onPress={() => this.navigateToScreen('ThemeView')}
							testID='settings-view-theme'
						/>
						<List.Separator />
						<List.Item
							title='Screen_lock'
							showActionIndicator
							onPress={() => this.navigateToScreen('ScreenLockConfigView')}
						/>
						<List.Separator />
					</List.Section>

					<List.Section>
						<List.Separator />
						<List.Item
							title='License'
							onPress={this.onPressLicense}
							showActionIndicator
							testID='settings-view-license'
						/>
						<List.Separator />
						<List.Item
							title={I18n.t('Version_no', { version: getReadableVersion })}
							onPress={this.copyAppVersion}
							testID='settings-view-version'
							translateTitle={false}
						/>
						<List.Separator />
						<List.Item
							title={I18n.t('Server_version', { version: server.version })}
							onPress={this.copyServerVersion}
							subtitle={`${ server.server.split('//')[1] }`}
							testID='settings-view-server-version'
							translateTitle={false}
							translateSubtitle={false}
						/>
						<List.Separator />
					</List.Section>

					{!isFDroidBuild ? (
						<>
							<List.Section>
								<List.Separator />
								<List.Item
									title='Log_analytics_events'
									testID='settings-view-analytics-events'
									right={() => this.renderAnalyticsEventsSwitch()}
								/>
								<List.Separator />
								<List.Item
									title='Send_crash_report'
									testID='settings-view-crash-report'
									right={() => this.renderCrashReportSwitch()}
								/>
								<List.Separator />
								<List.Info info='Crash_report_disclaimer' />
							</List.Section>
						</>
					) : null}

					<List.Section>
						<List.Separator />
						<List.Item
							title='Clear_cache'
							testID='settings-clear-cache'
							onPress={this.handleClearCache}
							showActionIndicator
							color={themes[theme].dangerColor}
						/>
						<List.Separator />
						<List.Item
							title='Logout'
							testID='settings-logout'
							onPress={this.handleLogout}
							showActionIndicator
							color={themes[theme].dangerColor}
						/>
						<List.Separator />
					</List.Section>
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server,
	user: getUserSelector(state),
	allowCrashReport: state.crashReport.allowCrashReport,
	allowAnalyticsEvents: state.crashReport.allowAnalyticsEvents,
	isMasterDetail: state.app.isMasterDetail
});

const mapDispatchToProps = dispatch => ({
	logout: () => dispatch(logoutAction()),
	selectServerRequest: params => dispatch(selectServerRequestAction(params)),
	toggleCrashReport: params => dispatch(toggleCrashReportAction(params)),
	toggleAnalyticsEvents: params => dispatch(toggleAnalyticsEventsAction(params)),
	appStart: params => dispatch(appStartAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SettingsView));
