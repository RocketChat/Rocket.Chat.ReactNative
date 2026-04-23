import React from 'react';
import { View } from 'react-native';

import { type TIconsName } from '../../../containers/CustomIcon';
import { type ISubscription, SubscriptionType } from '../../../definitions';
import i18n from '../../../i18n';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import styles from '../styles';
import { compareServerVersion } from '../../../lib/methods/helpers';
import { useE2EEWarning } from '../hooks';
import { useActionSheet } from '../../../containers/ActionSheet';
import type { TActionSheetOptionsItem } from '../../../containers/ActionSheet';
import { BaseButton } from './BaseButton';
import { useNewMediaCall } from '../../../lib/hooks/useNewMediaCall';

type ButtonConfig = {
	label: string;
	iconName: TIconsName;
	onPress: () => void;
	danger?: boolean;
	enabled?: boolean;
	show: boolean;
};

interface IRoomInfoButtons {
	rid: string;
	room: ISubscription | undefined;
	roomUserId?: string;
	isDirect: boolean;
	fromRid?: string;
	handleCreateDirectMessage: () => void;
	handleIgnoreUser: () => void;
	handleBlockUser: () => void;
	handleReportUser: () => void;
	roomFromRid: ISubscription | undefined;
	serverVersion: string | null;
	itsMe?: boolean;
}

export const RoomInfoButtons = ({
	rid,
	room: roomFromProps,
	roomUserId,
	isDirect,
	fromRid,
	handleCreateDirectMessage,
	handleIgnoreUser,
	handleBlockUser,
	handleReportUser,
	roomFromRid,
	serverVersion,
	itsMe
}: IRoomInfoButtons): React.ReactElement => {
	'use memo';

	const room = roomFromRid || roomFromProps;
	const { showActionSheet } = useActionSheet();
	const { callEnabled, disabledTooltip, showInitCallActionSheet } = useVideoConf(rid);
	const { openNewMediaCall, hasMediaCallPermission } = useNewMediaCall(rid);

	// Following the web behavior, when is a DM with myself, shouldn't appear block or ignore option
	const isDmWithMyself = room?.uids?.filter((uid: string) => uid !== roomUserId).length === 0;
	const isFromDm = room?.t === SubscriptionType.DIRECT;
	const isDirectFromSaved = isDirect && fromRid && room;
	const isIgnored = room?.ignored?.includes?.(roomUserId || '');
	const isBlocked = room?.blocker;
	const hasE2EEWarning = useE2EEWarning(room);

	const renderIgnoreUser = isDirectFromSaved && !isFromDm && !isDmWithMyself;
	const renderBlockUser = !itsMe && isDirectFromSaved && isFromDm && !isDmWithMyself;
	const renderReportUser =
		!itsMe && isDirectFromSaved && !isDmWithMyself && compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.4.0');
	const renderVideoCall = !hasE2EEWarning && callEnabled && !roomFromRid;

	const allItems: ButtonConfig[] = [
		{
			label: i18n.t('Message'),
			iconName: 'message',
			onPress: handleCreateDirectMessage,
			enabled: true,
			show: true
		},
		{
			label: i18n.t('Voice_call'),
			iconName: 'phone',
			onPress: openNewMediaCall,
			enabled: true,
			show: hasMediaCallPermission && !itsMe
		},
		{
			label: i18n.t('Video_call'),
			iconName: 'video',
			onPress: showInitCallActionSheet,
			enabled: !disabledTooltip,
			show: renderVideoCall
		},
		{
			label: i18n.t(isIgnored ? 'Unignore' : 'Ignore'),
			iconName: 'ignore',
			onPress: handleIgnoreUser,
			enabled: true,
			show: !!renderIgnoreUser
		},
		{
			label: i18n.t(isBlocked ? 'Unblock' : 'Block'),
			iconName: 'ignore',
			onPress: handleBlockUser,
			enabled: true,
			show: !!renderBlockUser
		},
		{
			label: i18n.t('Report'),
			iconName: 'warning',
			onPress: handleReportUser,
			danger: true,
			enabled: true,
			show: !!renderReportUser
		}
	];

	const visibleItems = allItems.filter(i => i.show);
	const hasOverflow = visibleItems.length > 4;
	const primaryItems = hasOverflow ? visibleItems.slice(0, 3) : visibleItems;
	const overflowItems = hasOverflow ? visibleItems.slice(3) : [];

	const overflowOptions: TActionSheetOptionsItem[] = overflowItems.map(item => ({
		title: item.label,
		icon: item.iconName,
		onPress: item.onPress,
		danger: item.danger,
		enabled: item.enabled ?? true
	}));

	const handleMore = () => {
		showActionSheet({ options: overflowOptions });
	};

	return (
		<View style={styles.roomButtonsContainer}>
			{primaryItems.map(item => (
				<BaseButton
					key={item.label}
					onPress={item.onPress}
					label={item.label}
					iconName={item.iconName}
					danger={item.danger}
					enabled={item.enabled ?? true}
					showIcon={true}
				/>
			))}
			{hasOverflow && <BaseButton onPress={handleMore} label={i18n.t('More')} iconName='kebab' showIcon={true} enabled={true} />}
		</View>
	);
};

export default RoomInfoButtons;
