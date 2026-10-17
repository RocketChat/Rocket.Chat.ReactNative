import type { SubscriptionType } from '~/definitions';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { type TConferenceInfoResult } from '~/lib/hooks/useConferenceInfo';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { getConferenceChatThreadId } from '~/lib/methods/helpers/getConferenceChatThreadId';
import log from '~/lib/methods/helpers/log';
import { navigateToConferenceChat } from '~/lib/services/conference/navigateToConferenceChat';

export const useOpenConferenceChat = (info?: TConferenceInfoResult): (() => void) => {
	const isMasterDetail = useMasterDetail();
	const persistentChatEnabled = useAppSelector(state => !!state.settings.VideoConf_Enable_Persistent_Chat);
	const windowEnabled = useAppSelector(state => !!state.settings.VideoConf_Conference_Window_Enabled);
	const chatMode = useAppSelector(state => state.settings.VideoConf_Persistent_Chat_Mode as string | undefined);

	return () => {
		if (!info) {
			return;
		}
		const { rid, name, type } = info.chatAccess;
		const threadId = getConferenceChatThreadId({
			startedMessageId: info.messages.started,
			discussionRid: info.discussionRid,
			persistentChatEnabled,
			windowEnabled,
			chatMode
		});
		navigateToConferenceChat({ chat: { rid, name, t: type as SubscriptionType }, threadId, isMasterDetail }).catch(log);
	};
};
