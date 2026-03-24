import { useEffect, useState } from 'react';

import { type IMessage } from '../../../definitions';
import { getMessageById } from '../../../lib/database/services/Message';

// TODO: Not reactive. Should we work on an official version?
export const useMessage = (messageId: string): IMessage | undefined => {
	'use memo';

	const [message, setMessage] = useState<IMessage>();
	useEffect(() => {
		const load = async () => {
			const result = await getMessageById(messageId);
			if (result) {
				setMessage(result);
			}
		};
		load();
	}, [messageId]);

	return message;
};
