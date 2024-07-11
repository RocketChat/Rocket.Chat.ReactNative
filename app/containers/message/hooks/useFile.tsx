import { useEffect, useState } from 'react';

import { IAttachment } from '../../../definitions';
import { getMessageById } from '../../../lib/database/services/Message';

export const useFile = (file: IAttachment, messageId: string) => {
	const [localFile, setLocalFile] = useState(file);
	const [isMessagePersisted, setIsMessagePersisted] = useState(!!messageId);
	useEffect(() => {
		const checkMessage = async () => {
			const message = await getMessageById(messageId);
			if (!message) {
				setIsMessagePersisted(false);
			}
		};
		checkMessage();
	}, [messageId]);

	const manageForwardedFile = (f: Partial<IAttachment>) => {
		if (isMessagePersisted) {
			return;
		}
		setLocalFile(prev => ({ ...prev, ...f }));
	};
	return [isMessagePersisted ? file : localFile, manageForwardedFile] as const;
};
