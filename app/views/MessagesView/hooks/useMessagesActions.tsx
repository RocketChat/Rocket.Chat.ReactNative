import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { IAttachment, IMessage, SubscriptionType } from '../../../definitions';
import { Services } from '../../../lib/services';
import getThreadName from '../../../lib/methods/getThreadName';
import { useActionSheet } from '../../../containers/ActionSheet';
import { IRoomInfoParam } from '../../SearchMessagesView';
import { ChatsStackParamList } from '../../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../../stacks/MasterDetailStack/types';
import { TNavigation } from '../../../stacks/stackType';
import { TActionContentType, IMessageViewContent, IParams } from '../definitions';

interface IUseMessagesActions {
	navigation: CompositeNavigationProp<
		NativeStackNavigationProp<ChatsStackParamList, 'MessagesView'>,
		NativeStackNavigationProp<MasterDetailInsideStackParamList & TNavigation>
	>;
	rid: string;
	t: SubscriptionType;
	room: any;
	isMasterDetail: boolean;
	content: IMessageViewContent | any;
	updateMessagesOnActionPress: (message_id: string) => void;
}

const useMessagesActions = ({
	navigation,
	rid,
	t,
	room,
	updateMessagesOnActionPress,
	content,
	isMasterDetail
}: IUseMessagesActions) => {
	const { showActionSheet } = useActionSheet();

	const navToRoomInfo = (navParam: IRoomInfoParam) => {
		navigation.navigate('RoomInfoView', navParam);
	};

	const showAttachment = (attachment: IAttachment) => {
		navigation.navigate('AttachmentView', { attachment });
	};

	const jumpToMessage = async ({ item }: { item: IMessage }) => {
		let params: IParams = {
			rid,
			jumpToMessageId: item._id,
			t,
			room
		};

		if (item.tmid) {
			if (isMasterDetail) {
				navigation.navigate('DrawerNavigator');
			} else {
				navigation.pop(2);
			}
			params = {
				...params,
				tmid: item.tmid,
				name: await getThreadName(rid, item.tmid, item._id),
				t: SubscriptionType.THREAD
			};
			navigation.push('RoomView', params);
		} else {
			navigation.navigate('RoomView', params);
		}
	};

	const onLongPress = (message: IMessage) => {
		handleShowActionSheet(message);
	};

	const handleShowActionSheet = (message?: IMessage) => {
		showActionSheet({ options: [content.action(message)], hasCancel: true });
	};

	const handleActionPress = async (actionContentType: TActionContentType, message: IMessage) => {
		try {
			let result;
			switch (actionContentType) {
				case 'PIN':
					result = await Services.togglePinMessage(message._id, message.pinned);
					break;
				case 'STAR':
					result = await Services.toggleStarMessage(message._id, message.starred);
					break;
			}

			if (result.success) {
				updateMessagesOnActionPress(message?._id);
			}
		} catch {
			// Do nothing
		}
	};

	return { handleActionPress, onLongPress, jumpToMessage, showAttachment, navToRoomInfo };
};

export default useMessagesActions;
