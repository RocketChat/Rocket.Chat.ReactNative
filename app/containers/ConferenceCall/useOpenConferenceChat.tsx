import I18n from '~/i18n';
import { useActionSheet } from '~/containers/ActionSheet';
import type { SubscriptionType } from '~/definitions';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { type TConferenceInfoResult } from '~/lib/hooks/useConferenceInfo';
import { getConferenceChatThreadId } from '~/lib/methods/helpers/getConferenceChatThreadId';
import { hasConferenceChatAccess } from '~/lib/methods/helpers/hasConferenceChatAccess';
import ConferenceChatSheetContent from './ConferenceChatSheetContent';

const CHAT_SHEET_SNAPS = ['95%', '100%'];

export const useOpenConferenceChat = (info?: TConferenceInfoResult): (() => void) => {
	const { showActionSheet } = useActionSheet();
	const viewerId = useAppSelector(state => state.login.user.id);
	const persistentChatEnabled = useAppSelector(state => !!state.settings.VideoConf_Enable_Persistent_Chat);
	const windowEnabled = useAppSelector(state => !!state.settings.VideoConf_Conference_Window_Enabled);
	const chatMode = useAppSelector(state => state.settings.VideoConf_Persistent_Chat_Mode as string | undefined);

	return () => {
		if (!info) {
			return;
		}
		const { rid, name, type, membersWithoutAccess } = info.chatAccess;
		const tmid = getConferenceChatThreadId({
			startedMessageId: info.messages.started,
			discussionRid: info.discussionRid,
			persistentChatEnabled,
			windowEnabled,
			chatMode
		});
		showActionSheet({
			children: (
				<ConferenceChatSheetContent
					rid={rid}
					t={type as SubscriptionType}
					name={name}
					tmid={tmid}
					title={('title' in info && info.title) || I18n.t('Chat')}
					canRead={hasConferenceChatAccess(membersWithoutAccess, viewerId)}
				/>
			),
			snaps: CHAT_SHEET_SNAPS,
			expandOnKeyboard: true,
			enableContentPanningGesture: false,
			fullContainer: true
		});
	};
};
