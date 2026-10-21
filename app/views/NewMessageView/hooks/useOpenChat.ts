import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { type ISearch, SubscriptionType, type TSubscriptionModel } from '~/definitions';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { assignRoomToCategory } from '~/lib/methods/assignRoomToCategory';
import { createDirectMessage } from '~/lib/methods/createDirectMessage';
import { emitErrorCreateDirectMessage } from '~/lib/methods/helpers/emitErrorCreateDirectMessage';
import { goRoom, type TGoRoomItem } from '~/lib/methods/helpers/goRoom';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { type NewMessageStackParamList } from '~/stacks/types';

export type TNewMessageChat = ISearch | TSubscriptionModel;

const isSearchResult = (chat: TNewMessageChat): chat is ISearch => 'search' in chat && !!chat.search;

const resolveDirectMessageRid = async (chat: TNewMessageChat) => {
	if (!isSearchResult(chat)) {
		return chat.rid;
	}
	const result = await createDirectMessage(chat.username);
	if (!result.success) {
		emitErrorCreateDirectMessage(result);
		return undefined;
	}
	return result.room?._id;
};

const openChatInCategory = async (chat: TNewMessageChat, categoryId: string, isMasterDetail: boolean) => {
	try {
		const rid = await resolveDirectMessageRid(chat);
		if (!rid) {
			return;
		}
		assignRoomToCategory(rid, categoryId);
		await goRoom({ item: { rid, name: chat.name, t: SubscriptionType.DIRECT }, isMasterDetail });
	} catch (error: any) {
		emitErrorCreateDirectMessage(error?.data);
	}
};

export const useOpenChat = (categoryId?: string) => {
	const navigation = useNavigation<NativeStackNavigationProp<NewMessageStackParamList, 'NewMessageView'>>();
	const isMasterDetail = useMasterDetail();

	return useCallback(
		(chat: TNewMessageChat) => {
			logEvent(events.NEW_MSG_CHAT_WITH_USER);
			navigation.pop();
			if (categoryId) {
				return openChatInCategory(chat, categoryId, isMasterDetail);
			}
			return goRoom({ item: chat as TGoRoomItem, isMasterDetail });
		},
		[categoryId, isMasterDetail, navigation]
	);
};
