import React, { useContext } from 'react';
import { dequal } from 'dequal';
import { View } from 'react-native';

import { Reply } from './components';
import MessageContext from '../../Context';
import { type IMessageAttachments } from '../../interfaces';
import { type IAttachment } from '../../../../definitions';
import { getMessageFromAttachment } from '../../utils';

const isQuoteAttachment = (file?: IAttachment): boolean => {
	if (!file) return false;

	if (!file.color && !file.text && (file.image_url || file.audio_url || file.video_url || file.collapsed)) {
		return false;
	}

	if (file.actions?.length) {
		return false;
	}

	return true;
};

const Quote: React.FC<IMessageAttachments> = React.memo(
	({ attachments, timeFormat, showAttachment, getCustomEmoji }: IMessageAttachments) => {
		'use memo';

		const { translateLanguage } = useContext(MessageContext);

		const quotes = attachments?.filter(isQuoteAttachment);

		if (!quotes || !quotes?.length) {
			return null;
		}

		const quotesElements = quotes.map((file: IAttachment, index: number) => {
			const msg = getMessageFromAttachment(file, translateLanguage);

			return (
				<Reply
					key={index}
					attachment={file}
					timeFormat={timeFormat}
					getCustomEmoji={getCustomEmoji}
					msg={msg}
					showAttachment={showAttachment}
				/>
			);
		});

		return <View style={{ gap: 4 }}>{quotesElements}</View>;
	},
	(prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments)
);

Quote.displayName = 'MessageQuote';

export default Quote;
