import { useAttachments, useMessageGrouping } from '~/containers/message/stores/MessageStore';
import { useContentVariant } from '../Content/useContentVariant';
import { isContentAttachment, isQuoteAttachment } from '../Attachments/utils';

export const useStartsWithAttachment = (): boolean => {
	const isHeader = useMessageGrouping();
	const attachments = useAttachments();
	const contentVariant = useContentVariant();

	if (!isHeader || !attachments?.length) {
		return false;
	}
	if (attachments.some(isQuoteAttachment)) {
		return true;
	}
	return !contentVariant && attachments.some(isContentAttachment);
};
