import { useContext, type FC } from 'react';
import { View } from 'react-native';

import { Reply } from './components';
import MessageContext from '../../Context';
import { type IMessageAttachments } from '../../interfaces';
import { type IAttachment } from '../../../../definitions';
import { getMessageFromAttachment } from '../../utils';
import { isQuoteAttachment } from './utils';

const Quote: FC<IMessageAttachments> = ({ attachments, timeFormat }: IMessageAttachments) => {
	'use memo';

	const { translateLanguage, getCustomEmoji = () => null } = useContext(MessageContext);

	const quotes = attachments?.filter(isQuoteAttachment);

	if (!quotes || !quotes?.length) {
		return null;
	}

	const quotesElements = quotes.map((file: IAttachment, index: number) => {
		const msg = getMessageFromAttachment(file, translateLanguage);

		return <Reply key={index} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} msg={msg} />;
	});

	return <View style={{ gap: 4 }}>{quotesElements}</View>;
};

Quote.displayName = 'MessageQuote';

export default Quote;
