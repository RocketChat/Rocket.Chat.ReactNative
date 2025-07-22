import { useCallback, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import { useAppSelector } from '../../../lib/hooks';
import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
import { getUserSelector } from '../../../selectors/login';
import RoomsListHeaderView from '../components/Header';
import { useTheme } from '../../../theme';
import i18n from '../../../i18n';
import { events, logEvent } from '../../../lib/methods/helpers/log';

export const useHeader = () => {
	// const { searching, canCreateRoom } = this.state;
	// // const { navigation, isMasterDetail, issuesWithNotifications, supportedVersionsStatus, theme, user } = this.props;

	// if (searching) {
	// 	return {
	// 		headerLeft: () => (
	// 			<HeaderButton.Container style={{ marginLeft: 1 }} left>
	// 				<HeaderButton.Item iconName='close' onPress={this.cancelSearch} />
	// 			</HeaderButton.Container>
	// 		),
	// 		headerTitle: () => <RoomsListHeaderView />,
	// 		headerRight: () => null
	// 	};
	// }

	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);
	const requirePasswordChange = useAppSelector(state => getUserSelector(state).requirePasswordChange);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const navigation = useNavigation<any>();
	const issuesWithNotifications = useAppSelector(state => state.troubleshootingNotification.issuesWithNotifications);
	const notificationPresenceCap = useAppSelector(state => state.app.notificationPresenceCap);
	const { colors } = useTheme();

	const disabled = supportedVersionsStatus === 'expired' || requirePasswordChange;

	const getBadge = useCallback(() => {
		if (supportedVersionsStatus === 'warn') {
			return <HeaderButton.BadgeWarn color={colors.buttonBackgroundDangerDefault} />;
		}
		if (notificationPresenceCap) {
			return <HeaderButton.BadgeWarn color={colors.userPresenceDisabled} />;
		}
		return null;
	}, [supportedVersionsStatus, notificationPresenceCap, colors]);

	const goDirectory = useCallback(() => {
		logEvent(events.RL_GO_DIRECTORY);
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'DirectoryView' });
		} else {
			navigation.navigate('DirectoryView');
		}
	}, [isMasterDetail, navigation]);

	const navigateToPushTroubleshootView = useCallback(() => {
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'PushTroubleshootView' });
		} else {
			navigation.navigate('PushTroubleshootView');
		}
	}, [isMasterDetail, navigation]);

	useLayoutEffect(() => {
		console.count(`useHeader.useLayoutEffect calls`);
		const options = {
			headerLeft: () => (
				<HeaderButton.Drawer
					navigation={navigation}
					testID='rooms-list-view-sidebar'
					onPress={
						isMasterDetail
							? () => navigation.navigate('ModalStackNavigator', { screen: 'SettingsView' })
							: () => navigation.toggleDrawer()
					}
					badge={getBadge}
					disabled={disabled}
				/>
			),
			headerTitle: () => <RoomsListHeaderView />,
			headerRight: () => (
				<HeaderButton.Container>
					{issuesWithNotifications ? (
						<HeaderButton.Item
							iconName='notification-disabled'
							onPress={navigateToPushTroubleshootView}
							testID='rooms-list-view-push-troubleshoot'
							color={colors.fontDanger}
						/>
					) : null}
					{/* {canCreateRoom ? (
						<HeaderButton.Item
							iconName='create'
							accessibilityLabel={I18n.t('Create_new_channel_team_dm_discussion')}
							onPress={this.goToNewMessage}
							testID='rooms-list-view-create-channel'
							disabled={disabled}
						/>
					) : null} */}
					{/* <HeaderButton.Item
						iconName='search'
						accessibilityLabel={i18n.t('Search')}
						onPress={this.initSearching}
						testID='rooms-list-view-search'
						disabled={disabled}
					/> */}
					<HeaderButton.Item
						iconName='directory'
						accessibilityLabel={i18n.t('Directory')}
						onPress={goDirectory}
						testID='rooms-list-view-directory'
						disabled={disabled}
					/>
				</HeaderButton.Container>
			)
		};

		navigation.setOptions(options);

		return () => {
			// TODO: Remove this
			console.countReset(`useHeader.useLayoutEffect calls`);
		};
	}, [
		disabled,
		issuesWithNotifications,
		navigation,
		isMasterDetail,
		colors,
		goDirectory,
		navigateToPushTroubleshootView,
		getBadge
	]);

	return null;
};
