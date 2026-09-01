import { StyleSheet, View } from 'react-native';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import CollapsibleQuote from './CollapsibleQuote';
import AttachedActions from './AttachedActions';
import Reply from './Reply';
import { type IAttachment } from '../../../../definitions';
import { useShowAttachment } from '../../stores/MessageRoomStore';
import { useMessageField, useTranslateLanguage } from '../../stores/MessageStore';
import { getMessageFromAttachment } from '../../utils';
import { getAttachmentKey, isContentAttachment, isQuoteAttachment } from './utils';

const styles = StyleSheet.create({
	container: {
		gap: 4
	}
});

interface IAttachments {
	attachments?: IAttachment[];
	variant?: 'content' | 'quote';
}

const NestedReply = ({ attachment }: { attachment: IAttachment }) => (
	<Reply attachment={attachment}>
		<Attachments attachments={attachment.attachments} variant='quote' />
		<Attachments attachments={attachment.attachments} />
	</Reply>
);

const Attachments = ({ attachments, variant = 'content' }: IAttachments) => {
	const translateLanguage = useTranslateLanguage();
	const showAttachment = useShowAttachment();
	const author = useMessageField(item => item.u);

	const isQuote = variant === 'quote';
	const files = attachments?.filter(isQuote ? isQuoteAttachment : isContentAttachment);

	if (!files || files.length === 0) {
		return null;
	}

	const elements = files.map((file, index) => {
		const msg = getMessageFromAttachment(file, translateLanguage);

		if (isQuote) {
			return <NestedReply key={getAttachmentKey(file, 'reply', index)} attachment={file} />;
		}

		if (file.image_url) {
			return (
				<Image
					key={file.image_url}
					file={file}
					showAttachment={showAttachment}
					author={author}
					msg={msg}
					imagePreview={file.image_preview}
					imageType={file.image_type}
				/>
			);
		}

		if (file.audio_url) {
			return <Audio key={file.audio_url} file={file} author={author} msg={msg} />;
		}

		if (file.video_url) {
			return <Video key={file.video_url} file={file} showAttachment={showAttachment} author={author} msg={msg} />;
		}

		if (file.actions && file.actions.length > 0) {
			return <AttachedActions key={getAttachmentKey(file, 'actions', index)} attachment={file} />;
		}
		if (typeof file.collapsed === 'boolean') {
			return <CollapsibleQuote key={getAttachmentKey(file, 'collapsible', index)} attachment={file} />;
		}

		if (file.attachments?.length) {
			return <NestedReply key={getAttachmentKey(file, 'reply', index)} attachment={file} />;
		}

		return null;
	});

	return <View style={styles.container}>{elements}</View>;
};

export default Attachments;
