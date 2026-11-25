import { StyleSheet, View } from 'react-native';

import { type IAttachment } from '~/definitions/IAttachment';
import { type IUserMessage } from '~/definitions/IMessage';
import AudioPlayer from '~/containers/AudioPlayer';
import Markdown from '~/containers/markdown';
import { useMediaAutoDownload } from '~/containers/message/hooks/useMediaAutoDownload';
import { useMessageUser, useRid } from '~/containers/message/stores/MessageRoomStore';
import { useMessageId } from '~/containers/message/stores/MessageStore';

const styles = StyleSheet.create({
	container: {
		gap: 4
	},
	player: {
		maxWidth: 368
	}
});

interface IMessageAudioProps {
	file: IAttachment;
	author?: IUserMessage;
	msg?: string;
}

const MessageAudio = ({ file, author, msg }: IMessageAudioProps) => {
	const user = useMessageUser();
	const id = useMessageId();
	const rid = useRid();
	const { status, onPress, url, currentFile } = useMediaAutoDownload({ file, author });
	const fileUri = status === 'downloaded' ? (currentFile.title_link ?? url) : url;

	return (
		<View style={styles.container}>
			{msg ? <Markdown msg={msg} username={user?.username} /> : null}
			<View style={styles.player}>
				<AudioPlayer msgId={id} fileUri={fileUri} downloadState={status} onPlayButtonPress={onPress} rid={rid ?? ''} />
			</View>
		</View>
	);
};

export default MessageAudio;
