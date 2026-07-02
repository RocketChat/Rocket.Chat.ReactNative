import { type FC } from 'react';
import { View } from 'react-native';

import { Reply } from './components';
import { type IMessageAttachments } from '../../interfaces';
import { type IAttachment } from '../../../../definitions';
import { getMessageFromAttachment } from '../../utils';
import { isQuoteAttachment } from './utils';
import { useGetCustomEmoji } from '../../MessageRoomStore';
import { useContentData, useTranslateLanguage } from '../../MessageStore';

const Quote: FC<IMessageAttachments> = ({ attachments }: IMessageAttachments) => {
	'use memo';

	const translateLanguage = useTranslateLanguage();
	const getCustomEmoji = useGetCustomEmoji() ?? (() => null);
	const { attachments: storeAttachments } = useContentData();
	const resolved = attachments ?? storeAttachments;

	const quotes = resolved?.filter(isQuoteAttachment);

	if (!quotes || !quotes?.length) {
		return null;
	}

	const quotesElements = quotes.map((file: IAttachment, index: number) => {
		const msg = getMessageFromAttachment(file, translateLanguage);

		return <Reply key={index} attachment={file} getCustomEmoji={getCustomEmoji} msg={msg} />;
	});

	return <View style={{ gap: 4 }}>{quotesElements}</View>;
};

Quote.displayName = 'MessageQuote';

export default Quote;
