import { memo } from 'react';
import { Alert, Linking, View } from 'react-native';
import { shallowEqual, useDispatch } from 'react-redux';

import { CustomIcon } from '../../../containers/CustomIcon';
import Status from '../../../containers/Status/Status';
import * as List from '../../../containers/List';
import styles from '../styles';
import { useTheme } from '../../../theme';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { setNotificationPresenceCap } from '../../../actions/app';
import userPreferences from '../../../lib/methods/userPreferences';
import I18n from '../../../i18n';
import { NOTIFICATION_PRESENCE_CAP } from '../../../lib/constants/notifications';
import { sidebarNavigate } from '../methods/sidebarNavigate';

const CustomStatus = () => {
	'use memo';

	const { colors } = useTheme();
	const { status: userStatus, statusText } = useAppSelector(getUserSelector, shallowEqual);
	const presenceBroadcastDisabled = useAppSelector(state => state.settings.Presence_broadcast_disabled) as boolean;
	const notificationPresenceCap = useAppSelector(state => state.app.notificationPresenceCap);
	const allowStatusMessage = useAppSelector(state => state.settings.Accounts_AllowUserStatusMessageChange);
	const dispatch = useDispatch();

	const onPressPresenceLearnMore = () => {
		dispatch(setNotificationPresenceCap(false));
		userPreferences.setBool(NOTIFICATION_PRESENCE_CAP, false);

		Alert.alert(
			I18n.t('Presence_Cap_Warning_Title'),
			I18n.t('Presence_Cap_Warning_Description'),
			[
				{
					text: I18n.t('Learn_more'),
					onPress: () => Linking.openURL('https://go.rocket.chat/i/presence-cap-learn-more'),
					style: 'cancel'
				},
				{
					text: I18n.t('Close'),
					style: 'default'
				}
			],
			{ cancelable: false }
		);
	};

	let status = userStatus;
	if (presenceBroadcastDisabled) {
		status = 'disabled';
	}

	let right: (() => JSX.Element | null) | undefined = () => <CustomIcon name='edit' size={20} color={colors.fontTitlesLabels} />;
	if (notificationPresenceCap) {
		right = () => <View style={[styles.customStatusDisabled, { backgroundColor: colors.userPresenceDisabled }]} />;
	} else if (presenceBroadcastDisabled) {
		right = undefined;
	}

	if (!allowStatusMessage) {
		return null;
	}

	return (
		<>
			<List.Item
				title={statusText || 'Edit_Status'}
				left={() => <Status size={24} status={status} />}
				right={right}
				onPress={() => (presenceBroadcastDisabled ? onPressPresenceLearnMore() : sidebarNavigate('StatusView'))}
				translateTitle={!statusText}
				testID={`sidebar-custom-status-${status}`}
			/>
			<List.Separator />
		</>
	);
};

export default memo(CustomStatus);
