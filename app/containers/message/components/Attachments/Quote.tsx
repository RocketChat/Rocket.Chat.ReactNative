import { type FC } from 'react';
import { View } from 'react-native';

import { Reply } from './components';
import { type IMessageAttachments } from '../../interfaces';
import { type IAttachment } from '../../../../definitions';
import { getMessageFromAttachment } from '../../utils';
import { isQuoteAttachment } from './utils';
import { useTranslateLanguage } from '../../stores/MessageStore';
import { useCustomEmoji } from '../../../../lib/hooks/useCustomEmoji';

const Quote: FC<IMessageAttachments> = ({ attachments }: IMessageAttachments) => {
	'use memo';

	const translateLanguage = useTranslateLanguage();
	const getCustomEmoji = useCustomEmoji();

	const quotes = attachments?.filter(isQuoteAttachment);

	if (!quotes || !quotes?.length) {
		return null;
	}

	const quotesElements = quotes.map((file: IAttachment, index: number) => {
		const msg = getMessageFromAttachment(file, translateLanguage);

		return (
			<Reply
				key={file.title_link || file.message_link || `reply-${index}`}
				attachment={file}
				getCustomEmoji={getCustomEmoji}
				msg={msg}
			/>
		);
	});

	return <View style={{ gap: 4 }}>{quotesElements}</View>;
};

Quote.displayName = 'MessageQuote';

export default Quote;
