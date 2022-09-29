import Clipboard from '@react-native-clipboard/clipboard';
import CookieManager from '@react-native-cookies/cookies';
import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect } from 'react';
import { Linking, Share } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useDispatch } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';

import { appStart } from '../../actions/app';
import { logout } from '../../actions/login';
import { selectServerRequest } from '../../actions/server';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { LISTENER } from '../../containers/Toast';
import { RootEnum } from '../../definitions';
import I18n from '../../i18n';
import { APP_STORE_LINK, FDROID_MARKET_LINK, isFDroidBuild, LICENSE_LINK, PLAY_MARKET_LINK } from '../../lib/constants';
import database from '../../lib/database';
import { useAppSelector } from '../../lib/hooks';
import { clearCache } from '../../lib/methods';
import { deleteAllAudioFiles } from '../../lib/methods/audioFile';
import { getDeviceModel, getReadableVersion, isAndroid } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers/info';
import { events, logEvent } from '../../lib/methods/helpers/log';
import openLink from '../../lib/methods/helpers/openLink';
import { onReviewPress } from '../../lib/methods/helpers/review';
import { Services } from '../../lib/services';
import { getUserSelector } from '../../selectors/login';
import { SettingsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import SidebarView from '../SidebarView';

type TLogScreenName = 'SE_GO_LANGUAGE' | 'SE_GO_DEFAULTBROWSER' | 'SE_GO_THEME' | 'SE_GO_PROFILE' | 'SE_GO_SECURITYPRIVACY';

const SettingsView = (): React.ReactElement => {
	const { colors, theme } = useTheme();
	const navigation = useNavigation<StackNavigationProp<SettingsStackParamList, 'SettingsView'>>();
	const dispatch = useDispatch();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const userId = useAppSelector(state => getUserSelector(state).id);
	const { server, version } = useAppSelector(state => state.server);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () =>
				isMasterDetail ? (
					<HeaderButton.CloseModal navigation={navigation} testID='settings-view-close' />
				) : (
					<HeaderButton.Drawer navigation={navigation} testID='settings-view-drawer' />
				),
			title: I18n.t('Settings')
		});
	}, [navigation, isMasterDetail]);

	const checkCookiesAndLogout = async () => {
		const db = database.servers;
		const usersCollection = db.get('users');
		try {
			const userRecord = await usersCollection.find(userId);
			if (userRecord.isFromWebView) {
				showConfirmationAlert({
					title: I18n.t('Clear_cookies_alert'),
					message: I18n.t('Clear_cookies_desc'),
					confirmationText: I18n.t('Clear_cookies_yes'),
					dismissText: I18n.t('Clear_cookies_no'),
					onPress: async () => {
						await CookieManager.clearAll(true);
						dispatch(logout());
					},
					onCancel: () => {
						dispatch(logout());
					}
				});
			} else {
				dispatch(logout());
			}
		} catch {
			// Do nothing: user not found
		}
	};

	const handleLogout = () => {
		logEvent(events.SE_LOG_OUT);
		showConfirmationAlert({
			message: I18n.t('You_will_be_logged_out_of_this_application'),
			confirmationText: I18n.t('Logout'),
			onPress: checkCookiesAndLogout
		});
	};

	const handleClearCache = () => {
		logEvent(events.SE_CLEAR_LOCAL_SERVER_CACHE);
		showConfirmationAlert({
			message: I18n.t('This_will_clear_all_your_offline_data'),
			confirmationText: I18n.t('Clear'),
			onPress: async () => {
				dispatch(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('Clear_cache_loading') }));
				await deleteAllAudioFiles(server);
				await clearCache({ server });
				await FastImage.clearMemoryCache();
				await FastImage.clearDiskCache();
				Services.disconnect();
				dispatch(selectServerRequest(server));
			}
		});
	};

	const navigateToScreen = (screen: keyof SettingsStackParamList) => {
		const screenName = screen.replace('View', '').toUpperCase();
		logEvent(events[`SE_GO_${screenName}` as TLogScreenName]);
		navigation.navigate(screen);
	};

	const sendEmail = async () => {
		logEvent(events.SE_CONTACT_US);
		const subject = encodeURI('Rocket.Chat Mobile App Support');
		const email = encodeURI('support@rocket.chat');
		const description = encodeURI(`
			version: ${getReadableVersion}
			device: ${getDeviceModel}
		`);
		try {
			await Linking.openURL(`mailto:${email}?subject=${subject}&body=${description}`);
		} catch (e) {
			logEvent(events.SE_CONTACT_US_F);
			showErrorAlert(I18n.t('error-email-send-failed', { message: 'support@rocket.chat' }));
		}
	};

	const shareApp = () => {
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
	};

	const saveToClipboard = async (content: string) => {
		await Clipboard.setString(content);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	const copyServerVersion = () => {
		const vers = version as string;
		logEvent(events.SE_COPY_SERVER_VERSION, { serverVersion: vers });
		saveToClipboard(vers);
	};

	const copyAppVersion = () => {
		logEvent(events.SE_COPY_APP_VERSION, { appVersion: getReadableVersion });
		saveToClipboard(getReadableVersion);
	};

	const onPressLicense = () => {
		logEvent(events.SE_READ_LICENSE);
		openLink(LICENSE_LINK, theme);
	};

	return (
		<SafeAreaView testID='settings-view'>
			<StatusBar />
			<List.Container>
				{isMasterDetail ? (
					<>
						<List.Section>
							<List.Separator />
							<SidebarView />
							<List.Separator />
						</List.Section>
						<List.Section>
							<List.Separator />
							<List.Item title='Display' onPress={() => navigateToScreen('DisplayPrefsView')} showActionIndicator />
							<List.Separator />
							<List.Item
								title='Profile'
								onPress={() => navigateToScreen('ProfileView')}
								showActionIndicator
								testID='settings-profile'
							/>
							<List.Separator />
						</List.Section>
					</>
				) : null}

				<List.Section>
					<List.Separator />
					<List.Item title='Contact_us' onPress={sendEmail} showActionIndicator testID='settings-view-contact' />
					<List.Separator />
					<List.Item
						title='Language'
						onPress={() => navigateToScreen('LanguageView')}
						showActionIndicator
						testID='settings-view-language'
					/>
					<List.Separator />
					{!isFDroidBuild ? (
						<>
							<List.Item title='Review_this_app' showActionIndicator onPress={onReviewPress} testID='settings-view-review-app' />
						</>
					) : null}
					<List.Separator />
					<List.Item title='Share_this_app' showActionIndicator onPress={shareApp} testID='settings-view-share-app' />
					<List.Separator />
					<List.Item
						title='Default_browser'
						showActionIndicator
						onPress={() => navigateToScreen('DefaultBrowserView')}
						testID='settings-view-default-browser'
					/>
					<List.Separator />
					<List.Item
						title='Theme'
						showActionIndicator
						onPress={() => navigateToScreen('ThemeView')}
						testID='settings-view-theme'
					/>
					<List.Separator />
					<List.Item
						title='Security_and_privacy'
						showActionIndicator
						onPress={() => navigateToScreen('SecurityPrivacyView')}
						testID='settings-view-security-privacy'
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item title='License' onPress={onPressLicense} showActionIndicator testID='settings-view-license' />
					<List.Separator />
					<List.Item
						title={I18n.t('Version_no', { version: getReadableVersion })}
						onPress={copyAppVersion}
						testID='settings-view-version'
						translateTitle={false}
					/>
					<List.Separator />
					<List.Item
						title={I18n.t('Server_version', { version })}
						onPress={copyServerVersion}
						subtitle={`${server.split('//')[1]}`}
						testID='settings-view-server-version'
						translateTitle={false}
						translateSubtitle={false}
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						title='Clear_cache'
						testID='settings-view-clear-cache'
						onPress={handleClearCache}
						showActionIndicator
						color={colors.dangerColor}
					/>
					<List.Separator />
					<List.Item
						title='Logout'
						testID='settings-logout'
						onPress={handleLogout}
						showActionIndicator
						color={colors.dangerColor}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default SettingsView;
