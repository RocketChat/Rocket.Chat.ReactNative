import I18n from '~/i18n';
import { SubscriptionType } from '~/definitions';
import getThreadName from '~/lib/methods/getThreadName';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import Navigation from '~/lib/navigation/appNavigation';
import { useConferenceCallStore } from './useConferenceCallStore';

type TConferenceChat = { rid: string; name: string; t: SubscriptionType };

interface INavigateToConferenceChat {
	chat: TConferenceChat;
	threadId?: string;
	isMasterDetail: boolean;
}

export const navigateToConferenceChat = async ({ chat, threadId, isMasterDetail }: INavigateToConferenceChat): Promise<void> => {
	useConferenceCallStore.getState().minimize();

	const currentRoute = Navigation.getCurrentRoute();
	const openThreadId = (currentRoute?.params as { tmid?: string } | undefined)?.tmid;
	if (threadId && currentRoute?.name === 'RoomView' && openThreadId === threadId) {
		return;
	}
	if (currentRoute?.name !== 'RoomsListView' && currentRoute?.name !== 'RoomView') {
		Navigation.navigate('ChatsStackNavigator');
	}

	await goRoom({ item: chat, isMasterDetail });

	if (threadId) {
		const name = (await getThreadName(chat.rid, threadId, '')) || I18n.t('Video_call');
		Navigation.push('RoomView', { rid: chat.rid, tmid: threadId, name, t: SubscriptionType.THREAD });
	}
};
