import { IAttachment } from '../../definitions/IAttachment';

// https://github.com/RocketChat/Rocket.Chat/blame/edb4e2c91f4e8f90b0420be61270a75d49709732/packages/core-typings/src/IMessage/MessageAttachment/MessageQuoteAttachment.ts#L16
export const getQuoteMessageLink = (attachments?: IAttachment[]) => {
	const attachmentWithMessageLink = attachments?.find(attachment => 'message_link' in attachment);
	return attachmentWithMessageLink?.message_link;
};
