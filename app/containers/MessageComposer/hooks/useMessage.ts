import { useEffect, useState } from 'react';

import { type IMessage } from '../../../definitions';
import { getMessageById } from '../../../lib/database/services/Message';

// TODO: Not reactive. Should we work on an official version?
export const useMessage = (messageId: string, tmid?: string): IMessage | undefined => {
	const [message, setMessage] = useState<IMessage>();
	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			try {
				const result = await getMessageById(messageId, tmid);
				if (!cancelled) {
					setMessage(result || undefined);
				}
			} catch {
				if (!cancelled) {
					setMessage(undefined);
				}
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [messageId, tmid]);

	return message;
};
