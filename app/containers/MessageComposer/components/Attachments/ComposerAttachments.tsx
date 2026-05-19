import { StyleSheet } from 'react-native';

import { useComposerAttachments, useMessageComposerApi } from '../../context';
import { useActionSheet } from '../../../ActionSheet';
import Thumbs from '../../../Thumbs';
import I18n from '../../../../i18n';
import { type IShareAttachment } from '../../../../definitions';
import { AttachmentActionSheet } from './AttachmentActionSheet';

const styles = StyleSheet.create({
	list: {
		backgroundColor: 'transparent'
	},
	content: {
		paddingBottom: 4
	}
});

export const ComposerAttachments = () => {
	const attachments = useComposerAttachments();
	const { removeAttachment, updateAttachment } = useMessageComposerApi();
	const { showActionSheet } = useActionSheet();

	if (!attachments.length) {
		return null;
	}

	const onPress = (attachment: IShareAttachment) =>
		showActionSheet({
			children: <AttachmentActionSheet attachment={attachment} onSave={updated => updateAttachment(attachment.path, updated)} />,
			snaps: ['85%'],
			fullContainer: true
		});

	const onRemove = (attachment: IShareAttachment) => removeAttachment(attachment.path);

	return (
		<Thumbs
			attachments={attachments}
			onPress={onPress}
			onRemove={onRemove}
			style={styles.list}
			contentContainerStyle={styles.content}
			testID='message-composer-attachments'
			getAccessibilityLabel={item => item.filename}
			getAccessibilityHint={() => I18n.t('Edit_attachment_options')}
			getTestID={(_, index) => `message-composer-attachment-${index}`}
			getRemoveAccessibilityLabel={() => I18n.t('Remove_attachment')}
			getRemoveTestID={(_, index) => `message-composer-remove-attachment-${index}`}
		/>
	);
};
