import React, { useContext } from 'react';
import { View } from 'react-native';

import { IAttachment, IUserMessage } from '../../../../definitions';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import AudioPlayer from '../../../AudioPlayer';
import Markdown from '../../../markdown';
import MessageContext from '../../Context';
import { useMediaAutoDownload } from '../../hooks/useMediaAutoDownload';

interface IMessageAudioProps {
	file: IAttachment;
	getCustomEmoji: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
}

const MessageAudio = ({ file, getCustomEmoji, author, msg }: IMessageAudioProps) => {
	'use memo';

	const { user, id, rid } = useContext(MessageContext);
	const { status, onPress, url } = useMediaAutoDownload({ file, author });

	return (
		<View style={{ gap: 4 }}>
			{msg ? <Markdown msg={msg} username={user.username} getCustomEmoji={getCustomEmoji} /> : null}
			<AudioPlayer msgId={id} fileUri={url} downloadState={status} onPlayButtonPress={onPress} rid={rid} />
		</View>
	);
};

export default MessageAudio;
