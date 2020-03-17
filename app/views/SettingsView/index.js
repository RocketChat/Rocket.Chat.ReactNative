import React from 'react';
import {
	View, Linking, ScrollView, AsyncStorage, Switch, Text, Share, Clipboard
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import { logout as logoutAction } from '../../actions/login';
import { selectServerRequest as selectServerRequestAction } from '../../actions/server';
import { toggleCrashReport as toggleCrashReportAction } from '../../actions/crashReport';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';
import { DrawerButton, CloseModalButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
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
import sharedStyles from '../Styles';
import { loggerConfig, analytics } from '../../utils/log';
import { PLAY_MARKET_LINK, APP_STORE_LINK, LICENSE_LINK } from '../../constants/links';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import SidebarView from '../SidebarView';
import { withSplit } from '../../split';
import Navigation from '../../lib/Navigation';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import { appStart as appStartAction } from '../../actions';
import { onReviewPress } from '../../utils/review';
import { getUserSelector } from '../../selectors/login';

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

const ItemInfo = React.memo(({ info, theme }) => (
	<View style={[styles.infoContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		<Text style={[styles.infoText, { color: themes[theme].infoText }]}>{info}</Text>
	</View>
));
ItemInfo.propTypes = {
	info: PropTypes.string,
	theme: PropTypes.string
};

class SettingsView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => ({
		...themedHeader(screenProps.theme),
		headerLeft: screenProps.split ? (
			<CloseModalButton navigation={navigation} testID='settings-view-close' />
		) : (
			<DrawerButton navigation={navigation} />
		),
		title: I18n.t('Settings')
	});

	static propTypes = {
		navigation: PropTypes.object,
		server:	PropTypes.object,
		allowCrashReport: PropTypes.bool,
		toggleCrashReport: PropTypes.func,
		theme: PropTypes.string,
		split: PropTypes.bool,
		logout: PropTypes.func.isRequired,
		selectServerRequest: PropTypes.func,
		token: PropTypes.string,
		appStart: PropTypes.func
	}

	handleLogout = () => {
		showConfirmationAlert({
			message: I18n.t('You_will_be_logged_out_of_this_application'),
			callToAction: I18n.t('Logout'),
			onPress: () => {
				const { logout, split } = this.props;
				if (split) {
					Navigation.navigate('RoomView');
				}
				logout();
			}
		});
	}

	handleClearCache = () => {
		showConfirmationAlert({
			message: I18n.t('This_will_clear_all_your_offline_data'),
			callToAction: I18n.t('Clear'),
			onPress: async() => {
				const {
					server: { server }, appStart, selectServerRequest
				} = this.props;
				await appStart('loading', I18n.t('Clear_cache_loading'));
				await RocketChat.clearCache({ server });
				await selectServerRequest(server, null, true);
			}
		});
	}

	toggleCrashReport = (value) => {
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

	navigateToScreen = (screen) => {
		const { navigation } = this.props;
		navigation.navigate(screen);
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

	shareApp = () => {
		Share.share({ message: isAndroid ? PLAY_MARKET_LINK : APP_STORE_LINK });
	}

	copyServerVersion = () => {
		const { server } = this.props;
		this.saveToClipboard(server.version);
	}

	copyAppVersion = () => {
		this.saveToClipboard(getReadableVersion);
	}

	saveToClipboard = async(content) => {
		await Clipboard.setString(content);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	}

	onPressLicense = () => {
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

	render() {
		const { server, split, theme } = this.props;
		return (
			<SafeAreaView
				style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				testID='settings-view'
				forceInset={{ vertical: 'never' }}
			>
				<StatusBar theme={theme} />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={styles.listPadding}
					showsVerticalScrollIndicator={false}
					testID='settings-view-list'
				>
					{split ? (
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
	token: getUserSelector(state).token,
	allowCrashReport: state.crashReport.allowCrashReport
});

const mapDispatchToProps = dispatch => ({
	logout: () => dispatch(logoutAction()),
	selectServerRequest: params => dispatch(selectServerRequestAction(params)),
	toggleCrashReport: params => dispatch(toggleCrashReportAction(params)),
	appStart: (...params) => dispatch(appStartAction(...params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(withSplit(SettingsView)));
