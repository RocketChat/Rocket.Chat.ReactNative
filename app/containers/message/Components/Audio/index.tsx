import React, { useContext } from 'react';
import { StyleProp, TextStyle } from 'react-native';

import Markdown from '../../../markdown';
import MessageContext from '../../Context';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../../../definitions';
import AudioPlayer from '../../../AudioPlayer';

interface IMessageAudioProps {
	file: IAttachment;
	isReply?: boolean;
	style?: StyleProp<TextStyle>[];
	getCustomEmoji: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
}

const MessageAudio = ({ file, getCustomEmoji, author, isReply, style, msg }: IMessageAudioProps) => {
	const { baseUrl, user } = useContext(MessageContext);

	if (!baseUrl) {
		return null;
	}
	return (
		<>
			<Markdown msg={msg} style={[isReply && style]} username={user.username} getCustomEmoji={getCustomEmoji} />
			<AudioPlayer file={file} baseUrl={baseUrl} user={user} author={author} isReply={isReply} />
		</>
	);
};

export default MessageAudio;
