import type { SubscriptionType } from '~/definitions';
import { type TConferenceInfoResult } from '~/lib/hooks/useConferenceInfo';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import log from '~/lib/methods/helpers/log';
import { navigateToConferenceChat } from '~/lib/services/conference/navigateToConferenceChat';

export const useOpenConferenceChat = (chatAccess?: TConferenceInfoResult['chatAccess']): (() => void) => {
	const isMasterDetail = useMasterDetail();

	return () => {
		if (chatAccess) {
			const { rid, name, type } = chatAccess;
			navigateToConferenceChat({ chat: { rid, name, t: type as SubscriptionType }, isMasterDetail }).catch(log);
		}
	};
};
