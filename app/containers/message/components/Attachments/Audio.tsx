import { View } from 'react-native';

import { type IAttachment, type IUserMessage } from '../../../../definitions';
import { type TGetCustomEmoji } from '../../../../definitions/IEmoji';
import AudioPlayer from '../../../AudioPlayer';
import Markdown from '../../../markdown';
import { useMediaAutoDownload } from '../../hooks/useMediaAutoDownload';
import { useMessageUser, useRid } from '../../stores/MessageRoomStore';
import { useMessageId } from '../../stores/MessageStore';

interface IMessageAudioProps {
	file: IAttachment;
	getCustomEmoji: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
}

const MessageAudio = ({ file, getCustomEmoji, author, msg }: IMessageAudioProps) => {
	'use memo';

	const user = useMessageUser();
	const id = useMessageId();
	const rid = useRid();
	const { status, onPress, url } = useMediaAutoDownload({ file, author });

	return (
		<View style={{ gap: 4 }}>
			{msg ? <Markdown msg={msg} username={user?.username} getCustomEmoji={getCustomEmoji} /> : null}
			<AudioPlayer msgId={id} fileUri={url} downloadState={status} onPlayButtonPress={onPress} rid={rid ?? ''} />
		</View>
	);
};

export default MessageAudio;
