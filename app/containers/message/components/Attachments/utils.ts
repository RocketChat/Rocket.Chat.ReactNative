import { type IAttachment } from '../../../../definitions';

// Webhook/integration attachments can carry their own media alongside text/color (e.g. embeds).
const hasOwnMedia = (file: IAttachment): boolean => !!(file.image_url || file.audio_url || file.video_url);

// Quote renders attachments as a quote-style block (colored border + author/title/text):
// message quotes, forwarded messages without nested attachments, file attachments and webhook embeds.
export const isQuoteAttachment = (file?: IAttachment): boolean => {
	if (!file) return false;

	if (file.collapsed) return false;

	// Attachments with nested attachments (e.g. message link + quoted image) are rendered only by Attachments as Reply
	if (file.attachments?.length) {
		return false;
	}

	if (!file.color && !file.text && hasOwnMedia(file)) {
		return false;
	}

	if (file.actions?.length) {
		return false;
	}

	return true;
};

// Attachments renders concrete content: media players, images, action buttons, collapsible blocks and nested replies.
// NOTE: a webhook-style attachment with text/color AND media intentionally matches BOTH predicates:
// Quote renders the colored border + title + text, while Attachments renders the media (see #6698).
export const isContentAttachment = (file?: IAttachment): boolean => {
	if (!file) return false;

	return hasOwnMedia(file) || !!file.collapsed || !!file.actions?.length || !!file.attachments?.length;
};
