import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';

import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { getUserSelector } from '~/selectors/login';
import { useTheme } from '~/theme';

type TRoomsListModalScreen = 'DirectoryView' | 'DisplayPrefsView' | 'PushTroubleshootView';

interface IRoomsListRightActionsParams {
	showTroubleshoot: boolean;
	disabled: boolean;
	dangerColor: string;
	navigateToScreen: (screen: TRoomsListModalScreen) => void;
}

const getRoomsListRightActions = ({
	showTroubleshoot,
	disabled,
	dangerColor,
	navigateToScreen
}: IRoomsListRightActionsParams) => {
	const troubleshoot: IHeaderAction = {
		label: i18n.t('Troubleshooting'),
		icon: 'notification-disabled',
		tintColor: dangerColor,
		testID: 'rooms-list-view-push-troubleshoot',
		onPress: () => navigateToScreen('PushTroubleshootView')
	};
	const directory: IHeaderAction = {
		label: i18n.t('Directory'),
		icon: 'directory',
		testID: 'rooms-list-view-directory',
		disabled,
		onPress: () => {
			logEvent(events.RL_GO_DIRECTORY);
			navigateToScreen('DirectoryView');
		}
	};
	const displayPrefs: IHeaderAction = {
		label: i18n.t('Display'),
		icon: 'sort',
		testID: 'rooms-list-view-display-prefs',
		disabled,
		onPress: () => {
			logEvent(events.RL_GO_DISPLAY_PREFS);
			navigateToScreen('DisplayPrefsView');
		}
	};
	return { troubleshootActions: showTroubleshoot ? [troubleshoot] : [], browseActions: [directory, displayPrefs] };
};

export const useRoomsListHeaderState = () => {
	const navigation = useNavigation<any>();
	const isMasterDetail = useMasterDetail();
	const { colors } = useTheme();
	const supportedVersionsStatus = useAppSelector(state => state.supportedVersions.status);
	const requirePasswordChange = useAppSelector(state => getUserSelector(state).requirePasswordChange);
	const issuesWithNotifications = useAppSelector(state => state.troubleshootingNotification.issuesWithNotifications);
	const notificationPresenceCap = useAppSelector(state => state.app.notificationPresenceCap);
	const disabled = supportedVersionsStatus === 'expired' || !!requirePasswordChange;
	const showTroubleshoot = !!issuesWithNotifications && !__DEV__;

	const badgeColor =
		supportedVersionsStatus === 'warn'
			? colors.buttonBackgroundDangerDefault
			: notificationPresenceCap
				? colors.userPresenceDisabled
				: undefined;

	const navigateToScreen = useCallback(
		(screen: TRoomsListModalScreen) => {
			if (isMasterDetail) {
				navigation.navigate('ModalStackNavigator', { screen });
			} else {
				navigation.navigate(screen);
			}
		},
		[isMasterDetail, navigation]
	);

	const { troubleshootActions, browseActions } = useMemo(
		() => getRoomsListRightActions({ showTroubleshoot, disabled, dangerColor: colors.fontDanger, navigateToScreen }),
		[showTroubleshoot, disabled, colors.fontDanger, navigateToScreen]
	);

	const onDrawerPress = useCallback(() => {
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'SettingsView' });
		} else {
			navigation.toggleDrawer();
		}
	}, [isMasterDetail, navigation]);

	return { navigation, isMasterDetail, disabled, badgeColor, troubleshootActions, browseActions, onDrawerPress };
};
