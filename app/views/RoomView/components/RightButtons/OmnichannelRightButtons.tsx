import { type ReactElement } from 'react';
import { useStore } from 'zustand';
import { useNavigation } from '@react-navigation/native';

import { type TActionSheetOptionsItem, useActionSheet } from '~/containers/ActionSheet';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import i18n from '~/i18n';
import { showConfirmationAlert, showErrorAlert, isIOS } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { useCanReturnQueue } from '~/ee/omnichannel/hooks/useCanReturnQueue';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useSetting } from '~/lib/hooks/useSetting';
import { returnLivechat } from '~/lib/services/restApi';
import { type RoomStore } from '~/views/RoomView/definitions';
import { fromSubscription } from '~/views/RoomView/stores/RoomStoreContext';
import { useCanPlaceLivechatOnHold } from '~/views/RoomView/hooks/useCanPlaceLivechatOnHold';
import { navigateToScreen, type TRoomStackNavigation } from '~/views/RoomView/services/navigateToScreen';
import { closeLivechat } from '~/views/RoomView/services/closeLivechat';
import { placeLivechatOnHold } from '~/views/RoomView/services/placeLivechatOnHold';

import { ApplyRoomHeaderItems } from './ApplyRoomHeaderItems';
import { useGoRoomActionsView } from '~/views/RoomView/hooks/useGoRoomActionsView';

interface IOmnichannelRightButtonsProps {
	rid: string;
	roomStore: RoomStore;
}

export const OmnichannelRightButtons = ({ rid, roomStore }: IOmnichannelRightButtonsProps): ReactElement => {
	const onRoomInfoPress = useGoRoomActionsView(roomStore);
	const navigation = useNavigation<TRoomStackNavigation>();
	const isMasterDetail = useMasterDetail();
	const { showActionSheet } = useActionSheet();

	const livechatRequestComment = useSetting('Livechat_request_comment_when_closing_conversation') as boolean;

	const departmentId = useStore(
		roomStore,
		fromSubscription(room => room.departmentId, undefined)
	);
	const canForwardGuest = useStore(roomStore, s => s.canForwardGuest);
	const canReturnQueue = useCanReturnQueue(true);
	const canPlaceLivechatOnHold = useCanPlaceLivechatOnHold(roomStore);

	const handleReturnLivechat = () => {
		showConfirmationAlert({
			message: i18n.t('Would_you_like_to_return_the_inquiry'),
			confirmationText: i18n.t('Yes'),
			onPress: async () => {
				try {
					await returnLivechat(rid, departmentId);
				} catch (e: any) {
					showErrorAlert(e.reason, i18n.t('Oops'));
				}
			}
		});
	};

	const getMoreActions = () => {
		const options = [] as TActionSheetOptionsItem[];
		if (canPlaceLivechatOnHold) {
			options.push({
				title: i18n.t('Place_chat_on_hold'),
				icon: 'pause',
				onPress: () => placeLivechatOnHold({ rid, navigation })
			});
		}

		if (canForwardGuest) {
			options.push({
				title: i18n.t('Forward_Chat'),
				icon: 'chat-forward',
				onPress: () => {
					navigateToScreen({ navigation, isMasterDetail, screen: 'ForwardLivechatView', params: { rid } });
				}
			});
		}

		if (canReturnQueue) {
			options.push({
				title: i18n.t('Return_to_waiting_line'),
				icon: 'move-to-the-queue',
				onPress: () => handleReturnLivechat()
			});
		}

		options.push({
			title: i18n.t('Close'),
			icon: 'chat-close',
			onPress: () => closeLivechat({ rid, departmentId, isMasterDetail, livechatRequestComment, navigation }),
			danger: true
		});

		return options;
	};

	const showMoreActions = () => {
		logEvent(events.ROOM_SHOW_MORE_ACTIONS);
		showActionSheet({ options: getMoreActions() });
	};
	return (
		<ApplyRoomHeaderItems
			navigation={navigation}
			actions={[
				{
					type: 'menu',
					label: i18n.t('More'),
					accessibilityLabel: i18n.t('More'),
					icon: { type: 'sfSymbol', name: 'ellipsis' },
					menu: {
						items: [
							...(isIOS
								? [
										{
											type: 'action' as const,
											label: i18n.t('Room_Info'),
											icon: { type: 'sfSymbol' as const, name: 'info.circle' as const },
											onPress: onRoomInfoPress
										}
									]
								: []),
							...getMoreActions().map(action => ({
								type: 'action' as const,
								label: action.title,
								onPress: action.onPress,
								destructive: action.danger
							}))
						]
					},
					androidElement: (
						<HeaderButton.Item iconName='kebab' onPress={showMoreActions} testID='room-view-header-omnichannel-kebab' />
					)
				}
			]}
		/>
	);
};
