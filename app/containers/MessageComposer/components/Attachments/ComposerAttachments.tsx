import React from 'react';
import { StyleSheet } from 'react-native';

import { useComposerAttachments, useMessageComposerApi } from '../../context';
import { useActionSheet } from '../../../ActionSheet';
import { AttachmentThumbs } from '../../../AttachmentThumbs';
import I18n from '../../../../i18n';
import { type IShareAttachment } from '../../../../definitions';
import { AttachmentActionSheet } from './AttachmentActionSheet';

const styles = StyleSheet.create({
	list: {
		paddingTop: 8,
		paddingBottom: 4
	}
});

const getItemTestID = (_item: IShareAttachment, index: number) => `message-composer-attachment-${index}`;
const getRemoveTestID = (_item: IShareAttachment, index: number) => `message-composer-remove-attachment-${index}`;

export const ComposerAttachments = () => {
	const attachments = useComposerAttachments();
	const { removeAttachment, updateAttachment } = useMessageComposerApi();
	const { showActionSheet } = useActionSheet();

	if (!attachments.length) {
		return null;
	}

	const onPress = (item: IShareAttachment) =>
		showActionSheet({
			children: <AttachmentActionSheet attachment={item} onSave={attachment => updateAttachment(item.path, attachment)} />,
			snaps: ['85%'],
			fullContainer: true
		});

	return (
		<AttachmentThumbs
			attachments={attachments}
			onPress={onPress}
			onRemove={item => removeAttachment(item.path)}
			getItemAccessibilityHint={() => I18n.t('Edit_attachment_options')}
			removeAccessibilityLabel={I18n.t('Remove_attachment')}
			getItemTestID={getItemTestID}
			getRemoveTestID={getRemoveTestID}
			testID='message-composer-attachments'
			contentContainerStyle={styles.list}
		/>
	);
};
