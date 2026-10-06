import { View } from 'react-native';

import { type IAttachment, type IUserMessage } from '~/definitions';
import AudioPlayer from '~/containers/AudioPlayer';
import Markdown from '~/containers/markdown';
import { useMediaAutoDownload } from '~/containers/message/hooks/useMediaAutoDownload';
import { useMessageUser, useRid } from '~/containers/message/stores/MessageRoomStore';
import { useMessageId } from '~/containers/message/stores/MessageStore';

interface IMessageAudioProps {
	file: IAttachment;
	author?: IUserMessage;
	msg?: string;
}

const MessageAudio = ({ file, author, msg }: IMessageAudioProps) => {
	const user = useMessageUser();
	const id = useMessageId();
	const rid = useRid();
	const { status, onPress, url } = useMediaAutoDownload({ file, author });

	return (
		<View style={{ gap: 4 }}>
			{msg ? <Markdown msg={msg} username={user?.username} /> : null}
			<AudioPlayer msgId={id} fileUri={url} downloadState={status} onPlayButtonPress={onPress} rid={rid ?? ''} />
		</View>
	);
};

export default MessageAudio;
