import React from 'react';

import Message from './index';
import { useAppSelector } from '../../lib/hooks';
import { getUserSelector } from '../../selectors/login';
import { TAnyMessageModel, TGetCustomEmoji } from '../../definitions';

const MessagePreview = ({ message }: { message: TAnyMessageModel }) => {
	const { user, baseUrl, Message_TimeFormat, customEmojis, useRealName } = useAppSelector(state => ({
		user: getUserSelector(state),
		baseUrl: state.server.server,
		Message_TimeFormat: state.settings.Message_TimeFormat as string,
		customEmojis: state.customEmojis,
		useRealName: state.settings.UI_Use_Real_Name as boolean
	}));

	const getCustomEmoji: TGetCustomEmoji = name => {
		const emoji = customEmojis[name];
		return emoji ?? null;
	};
	return (
		<Message
			item={message}
			user={user}
			rid={message.rid}
			baseUrl={baseUrl}
			getCustomEmoji={getCustomEmoji}
			timeFormat={Message_TimeFormat}
			useRealName={useRealName}
			isPreview
		/>
	);
};

export default MessagePreview;
