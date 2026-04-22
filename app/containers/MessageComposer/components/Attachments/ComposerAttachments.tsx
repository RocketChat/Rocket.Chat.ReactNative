import React, { memo } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { BUTTON_HIT_SLOP } from '../../../message/utils';
import { useComposerAttachments, useMessageComposerApi } from '../../context';
import { useTheme } from '../../../../theme';
import { useActionSheet } from '../../../ActionSheet';
import { CustomIcon } from '../../../CustomIcon';
import Touch from '../../../Touch';
import { AttachmentActionSheet } from './AttachmentActionSheet';

const THUMB_SIZE = 64;

const styles = StyleSheet.create({
	list: {
		paddingTop: 8,
		paddingBottom: 4
	},
	item: {
		marginRight: 16
	},
	thumb: {
		width: THUMB_SIZE,
		height: THUMB_SIZE,
		borderRadius: 4,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1
	},
	removeButton: {
		position: 'absolute',
		top: -8,
		right: -8,
		width: 28,
		height: 28,
		borderWidth: 2,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center'
	},
	warningIcon: {
		position: 'absolute',
		right: 4,
		bottom: 4
	}
});

const ThumbContent = ({ path, mime }: { path: string; mime?: string }) => {
	const { colors } = useTheme();

	if (mime?.startsWith('image/')) {
		return <Image source={{ uri: path }} style={[styles.thumb, { borderColor: colors.strokeLight }]} />;
	}

	return (
		<View style={[styles.thumb, { borderColor: colors.strokeLight, backgroundColor: colors.surfaceNeutral }]}>
			<CustomIcon name={mime?.startsWith('video/') ? 'camera' : 'attach'} size={28} color={colors.badgeBackgroundLevel2} />
		</View>
	);
};

export const ComposerAttachments = memo(() => {
	'use memo';

	const attachments = useComposerAttachments();
	const { removeAttachment, updateAttachment } = useMessageComposerApi();
	const { colors } = useTheme();
	const { showActionSheet } = useActionSheet();

	if (!attachments.length) {
		return null;
	}

	return (
		<FlatList
			horizontal
			data={attachments}
			keyExtractor={item => item.path}
			contentContainerStyle={styles.list}
			showsHorizontalScrollIndicator={false}
			testID='message-composer-attachments'
			renderItem={({ item, index }) => (
				<Touch
					style={styles.item}
					onPress={() =>
						showActionSheet({
							children: (
								<AttachmentActionSheet attachment={item} onSave={attachment => updateAttachment(item.path, attachment)} />
							),
							snaps: ['85%']
						})
					}
					activeOpacity={0.7}
					testID={`message-composer-attachment-${index}`}>
					<>
						<ThumbContent path={item.path} mime={item.mime} />
						<RectButton
							hitSlop={BUTTON_HIT_SLOP}
							style={[
								styles.removeButton,
								{
									backgroundColor: colors.fontDefault,
									borderColor: colors.surfaceRoom
								}
							]}
							rippleColor={colors.surfaceNeutral}
							onPress={() => removeAttachment(item.path)}
							testID={`message-composer-remove-attachment-${index}`}>
							<CustomIcon name='close' color={colors.surfaceRoom} size={14} />
						</RectButton>
						{!item.canUpload ? (
							<CustomIcon name='warning' size={18} color={colors.buttonBackgroundDangerDefault} style={styles.warningIcon} />
						) : null}
					</>
				</Touch>
			)}
		/>
	);
});

ComposerAttachments.displayName = 'ComposerAttachments';
