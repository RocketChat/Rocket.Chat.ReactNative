import i18n from '../../../i18n';
import { useIsThreadRoom } from '../stores/MessageRoomStore';
import { useThreadData } from '../stores/MessageStore';

export const useMessageAccessibilityHint = (): string | undefined => {
	const { tlm, tcount } = useThreadData();
	const isThreadRoom = useIsThreadRoom();

	const hasThread = !!tlm && !isThreadRoom && tcount !== null;
	return hasThread ? i18n.t('A11y_press_to_view_thread') : undefined;
};
