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

const getAccessibilityLabel = (item: IShareAttachment) => item.filename;
const getAccessibilityHint = () => I18n.t('Edit_attachment_options');
const getTestID = (_: IShareAttachment, index: number) => `message-composer-attachment-${index}`;
const getRemoveAccessibilityLabel = () => I18n.t('Remove_attachment');
const getRemoveTestID = (_: IShareAttachment, index: number) => `message-composer-remove-attachment-${index}`;

export const ComposerAttachments = () => {
	'use memo';

	const attachments = useComposerAttachments();
	const { removeAttachment, updateAttachment } = useMessageComposerApi();
	const { showActionSheet } = useActionSheet();

	const onPress = (attachment: IShareAttachment) =>
		showActionSheet({
			children: <AttachmentActionSheet attachment={attachment} onSave={updated => updateAttachment(attachment.path, updated)} />,
			snaps: ['85%'],
			fullContainer: true
		});

	const onRemove = (attachment: IShareAttachment) => removeAttachment(attachment.path);

	if (!attachments.length) {
		return null;
	}

	return (
		<Thumbs
			attachments={attachments}
			onPress={onPress}
			onRemove={onRemove}
			style={styles.list}
			contentContainerStyle={styles.content}
			testID='message-composer-attachments'
			getAccessibilityLabel={getAccessibilityLabel}
			getAccessibilityHint={getAccessibilityHint}
			getTestID={getTestID}
			getRemoveAccessibilityLabel={getRemoveAccessibilityLabel}
			getRemoveTestID={getRemoveTestID}
		/>
	);
};
