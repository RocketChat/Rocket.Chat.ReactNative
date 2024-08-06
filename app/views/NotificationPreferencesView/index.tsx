import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TActionSheetOptionsItem, useActionSheet } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { IRoomNotifications, TRoomNotificationsModel } from '../../definitions';
import I18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks';
import { showErrorAlertWithEMessage } from '../../lib/methods/helpers';
import { compareServerVersion } from '../../lib/methods/helpers/compareServerVersion';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { Services } from '../../lib/services';
import { ChatsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { OPTIONS } from './options';
import Switch from '../../containers/Switch';

type TOptions = keyof typeof OPTIONS;
type TRoomNotifications = keyof IRoomNotifications;
type TUnionOptionsRoomNotifications = TOptions | TRoomNotifications;

interface IBaseParams {
	preference: TUnionOptionsRoomNotifications;
	room: TRoomNotificationsModel;
	onChangeValue: (pref: TUnionOptionsRoomNotifications, param: { [key: string]: string }, onError: () => void) => void;
}

const RenderListPicker = ({
	preference,
	room,
	title,
	testID,
	onChangeValue
}: {
	title: string;
	testID: string;
} & IBaseParams) => {
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const { colors } = useTheme();

	const pref = room[preference]
		? OPTIONS[preference as TOptions].find(option => option.value === room[preference])
		: OPTIONS[preference as TOptions][0];

	const [option, setOption] = useState(pref);

	const options: TActionSheetOptionsItem[] = OPTIONS[preference as TOptions].map(i => ({
		title: I18n.t(i.label, { defaultValue: i.label, second: i.second }),
		onPress: () => {
			hideActionSheet();
			onChangeValue(preference, { [preference]: i.value.toString() }, () => setOption(option));
			setOption(i);
		},
		right: option?.value === i.value ? () => <CustomIcon name={'check'} size={20} color={colors.strokeHighlight} /> : undefined
	}));

	const label = option?.label ? I18n.t(option?.label, { defaultValue: option?.label, second: option?.second }) : option?.label;

	return (
		<List.Item
			title={title}
			testID={testID}
			onPress={() => showActionSheet({ options })}
			right={() => <Text style={[{ ...sharedStyles.textRegular, fontSize: 16 }, { color: colors.fontHint }]}>{label}</Text>}
			additionalAcessibilityLabel={label}
		/>
	);
};

const RenderSwitch = ({ preference, room, onChangeValue }: IBaseParams) => {
	const [switchValue, setSwitchValue] = useState(!room[preference]);
	return (
		<Switch
			value={switchValue}
			testID={preference as string}
			onValueChange={value => {
				onChangeValue(preference, { [preference]: switchValue ? '1' : '0' }, () => setSwitchValue(switchValue));
				setSwitchValue(value);
			}}
		/>
	);
};

const NotificationPreferencesView = (): React.ReactElement => {
	const route = useRoute<RouteProp<ChatsStackParamList, 'NotificationPrefView'>>();
	const { rid, room } = route.params;
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'NotificationPrefView'>>();
	const { serverVersion, isMasterDetail } = useAppSelector(state => ({
		serverVersion: state.server.version,
		isMasterDetail: state.app.isMasterDetail
	}));
	const [hideUnreadStatus, setHideUnreadStatus] = useState(room.hideUnreadStatus);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Notification_Preferences')
		});
	}, []);

	useEffect(() => {
		const observe = room.observe();
		observe.subscribe(data => {
			setHideUnreadStatus(data.hideUnreadStatus);
		});
	}, []);

	const navigateToPushTroubleshootView = () => {
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'PushTroubleshootView' });
		} else {
			navigation.navigate('PushTroubleshootView');
		}
	};

	const saveNotificationSettings = async (key: TUnionOptionsRoomNotifications, params: IRoomNotifications, onError: Function) => {
		try {
			// @ts-ignore
			logEvent(events[`NP_${key.toUpperCase()}`]);
			await Services.saveNotificationSettings(rid, params);
		} catch (e) {
			// @ts-ignore
			logEvent(events[`NP_${key.toUpperCase()}_F`]);
			log(e);
			onError();
			showErrorAlertWithEMessage(e);
		}
	};

	return (
		<SafeAreaView testID='notification-preference-view'>
			<StatusBar />
			<List.Container testID='notification-preference-view-list'>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Receive_Notification'
						testID='notification-preference-view-receive-notification'
						right={() => <RenderSwitch preference='disableNotifications' room={room} onChangeValue={saveNotificationSettings} />}
						additionalAcessibilityLabel={!room.disableNotifications}
					/>
					<List.Separator />
					<List.Info info={I18n.t('Receive_notifications_from', { name: room.name })} translateInfo={false} />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						title='Receive_Group_Mentions'
						testID='notification-preference-view-group-mentions'
						right={() => <RenderSwitch preference='muteGroupMentions' room={room} onChangeValue={saveNotificationSettings} />}
						// @ts-ignore
						additionalAcessibilityLabel={!room.muteGroupMentions}
					/>
					<List.Separator />
					<List.Info info='Receive_Group_Mentions_Info' />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						title='Mark_as_unread'
						testID='notification-preference-view-mark-as-unread'
						right={() => <RenderSwitch preference='hideUnreadStatus' room={room} onChangeValue={saveNotificationSettings} />}
						additionalAcessibilityLabel={!room.hideUnreadStatus}
					/>
					<List.Separator />
					<List.Info info='Mark_as_unread_Info' />
				</List.Section>

				{hideUnreadStatus && compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '4.8.0') ? (
					<List.Section>
						<List.Separator />
						<List.Item
							title='Show_badge_for_mentions'
							testID='notification-preference-view-badge-for-mentions'
							right={() => <RenderSwitch preference='hideMentionStatus' room={room} onChangeValue={saveNotificationSettings} />}
							additionalAcessibilityLabel={!room.hideMentionStatus}
						/>
						<List.Separator />
						<List.Info info='Show_badge_for_mentions_Info' />
					</List.Section>
				) : null}

				<List.Section title='In_App_And_Desktop'>
					<List.Separator />
					<RenderListPicker
						preference='desktopNotifications'
						room={room}
						title='Alert'
						testID='notification-preference-view-alert'
						onChangeValue={saveNotificationSettings}
					/>
					<List.Separator />
					<RenderListPicker
						preference='audioNotificationValue'
						room={room}
						title='Sound'
						testID='notification-preference-view-sound'
						onChangeValue={saveNotificationSettings}
					/>
					<List.Separator />
					<List.Info info='In_App_and_Desktop_Alert_info' />
				</List.Section>
				<List.Section title='Push_Notifications'>
					<List.Separator />
					<RenderListPicker
						preference='mobilePushNotifications'
						room={room}
						title='Alert'
						testID='notification-preference-view-push-notification'
						onChangeValue={saveNotificationSettings}
					/>
					<List.Separator />
					<List.Item
						title='Troubleshooting'
						onPress={navigateToPushTroubleshootView}
						testID='notification-preference-view-troubleshooting'
						showActionIndicator
					/>
					<List.Separator />
					<List.Info info='Push_Notifications_Alert_Info' />
				</List.Section>
				<List.Section title='Email'>
					<List.Separator />
					<RenderListPicker
						preference='emailNotifications'
						room={room}
						title='Alert'
						testID='notification-preference-view-email-alert'
						onChangeValue={saveNotificationSettings}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default NotificationPreferencesView;
