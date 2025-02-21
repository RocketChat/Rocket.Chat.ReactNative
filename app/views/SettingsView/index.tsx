import Clipboard from '@react-native-clipboard/clipboard';
import CookieManager from '@react-native-cookies/cookies';
import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect } from 'react';
import { Linking, Share } from 'react-native';
import { Image } from 'expo-image';
import { useDispatch } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { appStart } from '../../actions/app';
import { logout } from '../../actions/login';
import { selectServerRequest } from '../../actions/server';
import * as HeaderButton from '../../containers/HeaderButton';
import NewWindowIcon from '../../containers/NewWindowIcon';
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
import { deleteMediaFiles } from '../../lib/methods/handleMediaDownload';
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
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'SettingsView'>>();
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
				await deleteMediaFiles(server);
				await clearCache({ server });
				await Image.clearMemoryCache();
				await Image.clearDiskCache();
				Services.disconnect();
				dispatch(selectServerRequest(server, version, true));
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
							<List.Item
								title='Display'
								onPress={() => navigateToScreen('DisplayPrefsView')}
								showActionIndicator
								left={() => <List.Icon name='sort' />}
							/>
							<List.Separator />
							<List.Item
								title='Profile'
								onPress={() => navigateToScreen('ProfileView')}
								showActionIndicator
								testID='settings-profile'
								left={() => <List.Icon name='user' />}
							/>
							<List.Separator />
						</List.Section>
					</>
				) : null}

				<List.Section>
					<List.Separator />
					<List.Item
						title='Language'
						onPress={() => navigateToScreen('LanguageView')}
						showActionIndicator
						testID='settings-view-language'
						left={() => <List.Icon name='language' />}
					/>
					<List.Separator />
					<List.Item
						title='Default_browser'
						showActionIndicator
						onPress={() => navigateToScreen('DefaultBrowserView')}
						testID='settings-view-default-browser'
						left={() => <List.Icon name='federation' />}
					/>
					<List.Separator />
					<List.Item
						title='Theme'
						showActionIndicator
						onPress={() => navigateToScreen('ThemeView')}
						testID='settings-view-theme'
						left={() => <List.Icon name='moon' />}
					/>
					<List.Separator />
					<List.Item
						title='Media_auto_download'
						showActionIndicator
						onPress={() => navigateToScreen('MediaAutoDownloadView')}
						testID='settings-view-media-auto-download'
						left={() => <List.Icon name='download' />}
					/>
					<List.Separator />
					<List.Item
						title='Security_and_privacy'
						showActionIndicator
						onPress={() => navigateToScreen('SecurityPrivacyView')}
						testID='settings-view-security-privacy'
						left={() => <List.Icon name='locker' />}
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Item
						title='Get_help'
						left={() => <List.Icon name='support' />}
						showActionIndicator
						onPress={() => navigateToScreen('GetHelpView')}
						testID='settings-view-get-help'
					/>
					<List.Separator />
					<List.Item
						title='Share_this_app'
						showActionIndicator
						onPress={shareApp}
						testID='settings-view-share-app'
						left={() => <List.Icon name='arrow-forward' />}
					/>
					<List.Separator />
					<List.Item
						title='Legal'
						showActionIndicator
						onPress={() => navigateToScreen('LegalView')}
						testID='settings-view-legal'
						left={() => <List.Icon name='book' />}
					/>
					<List.Separator />
					<List.Item
						title='Contact_us'
						accessibilityRole='link'
						onPress={sendEmail}
						testID='settings-view-contact'
						left={() => <List.Icon name='mail' />}
						right={() => <NewWindowIcon />}
					/>
					<List.Separator />
					{!isFDroidBuild ? (
						<>
							<List.Item
								title='Review_this_app'
								accessibilityRole='link'
								onPress={onReviewPress}
								testID='settings-view-review-app'
								left={() => <List.Icon name='star' />}
								right={() => <NewWindowIcon />}
							/>
						</>
					) : null}
					<List.Separator />
					<List.Item
						title='License'
						accessibilityRole='link'
						onPress={onPressLicense}
						testID='settings-view-license'
						left={() => <List.Icon name='file-document' />}
						right={() => <NewWindowIcon />}
					/>
					<List.Separator />
					<List.Item
						title={I18n.t('Version_no', { version: getReadableVersion })}
						onPress={copyAppVersion}
						testID='settings-view-version'
						translateTitle={false}
						left={() => <List.Icon name='mobile' />}
					/>
					<List.Separator />
					<List.Item
						title={I18n.t('Server_version', { version })}
						onPress={copyServerVersion}
						subtitle={`${server.split('//')[1]}`}
						testID='settings-view-server-version'
						translateTitle={false}
						translateSubtitle={false}
						left={() => <List.Icon name='desktop' />}
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						title='Clear_cache'
						testID='settings-view-clear-cache'
						onPress={handleClearCache}
						color={colors.fontDanger}
						left={() => <List.Icon name='prune' color={colors.fontDanger} />}
					/>
					<List.Separator />
					<List.Item
						title='Logout'
						testID='settings-logout'
						onPress={handleLogout}
						color={colors.fontDanger}
						left={() => <List.Icon name='logout' color={colors.fontDanger} />}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default SettingsView;
