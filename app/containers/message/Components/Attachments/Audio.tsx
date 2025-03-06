import React, { useContext } from 'react';
import { StyleProp, TextStyle } from 'react-native';

import { IAttachment, IUserMessage } from '../../../../definitions';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import AudioPlayer from '../../../AudioPlayer';
import Markdown from '../../../markdown';
import MessageContext from '../../Context';
import { useMediaAutoDownload } from '../../hooks/useMediaAutoDownload';

interface IMessageAudioProps {
	file: IAttachment;
	isReply?: boolean;
	style?: StyleProp<TextStyle>[];
	getCustomEmoji: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
}

const MessageAudio = ({ file, getCustomEmoji, author, isReply, style, msg }: IMessageAudioProps) => {
	const { user, id, rid } = useContext(MessageContext);
	const { status, onPress, url } = useMediaAutoDownload({ file, author });

	return (
		<>
			<Markdown msg={msg} style={[isReply && style]} username={user.username} getCustomEmoji={getCustomEmoji} />
			<AudioPlayer msgId={id} fileUri={url} downloadState={status} onPlayButtonPress={onPress} rid={rid} />
		</>
	);
};

export default MessageAudio;
