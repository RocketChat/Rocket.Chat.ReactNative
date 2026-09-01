import { useEffect, useState } from 'react';

import { type IUserChannel } from '../../../definitions';
import { getMessageById } from '../../../lib/database/services/Message';
import { getMessageIdFromPermalink } from '../../../lib/methods/helpers/getMessageIdFromPermalink';

/**
 * A quote attachment carries the quoted message's text but not its `channels`, and the quoting
 * message has none of its own because its body is just a permalink. Without this, a discussion
 * mention inside a quote renders as the room id.
 *
 * The quoted message is normally already cached locally, so we read `channels` back off it.
 */
export const useQuotedMessageChannels = (messageLink?: string, enabled = true): IUserChannel[] | undefined => {
	const [channels, setChannels] = useState<IUserChannel[]>();

	useEffect(() => {
		let isActive = true;
		// Never let the previous quote's names label this one's mentions
		setChannels(undefined);

		const load = async () => {
			const messageId = getMessageIdFromPermalink(messageLink);
			if (!messageId || !enabled) {
				return;
			}
			try {
				// Reads through to the database, which has no active instance while servers switch
				const message = await getMessageById(messageId);
				if (isActive && message?.channels?.length) {
					setChannels(message.channels);
				}
			} catch {
				// Leaving `channels` unset falls back to the raw room id, which beats crashing the quote
			}
		};
		load();

		return () => {
			isActive = false;
		};
	}, [messageLink, enabled]);

	return channels;
};
