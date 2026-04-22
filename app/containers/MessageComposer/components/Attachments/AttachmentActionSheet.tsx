import React, { memo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import Button from '../../../Button';
import { CustomIcon } from '../../../CustomIcon';
import I18n from '../../../../i18n';
import { type IShareAttachment } from '../../../../definitions';
import { useActionSheet } from '../../../ActionSheet';
import { useTheme } from '../../../../theme';
import { useAltTextSupported } from '../../../../lib/hooks/useAltTextSupported';
import sharedStyles from '../../../../views/Styles';

const PREVIEW_HEIGHT = 240;

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 24,
		paddingBottom: 24
	},
	title: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 16,
		...sharedStyles.textRegular
	},
	preview: {
		height: PREVIEW_HEIGHT,
		borderRadius: 4,
		marginBottom: 24,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden'
	},
	image: {
		width: '100%',
		height: '100%'
	},
	label: {
		fontSize: 14,
		lineHeight: 18,
		marginBottom: 6,
		...sharedStyles.textSemibold
	},
	helper: {
		fontSize: 13,
		lineHeight: 18,
		marginBottom: 12,
		...sharedStyles.textRegular
	},
	input: {
		height: 160,
		borderRadius: 4,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginBottom: 20,
		fontSize: 16,
		lineHeight: 22,
		textAlignVertical: 'top',
		...sharedStyles.textRegular
	}
});

const Preview = ({ attachment }: { attachment: IShareAttachment }) => {
	const { colors } = useTheme();

	if (attachment.mime?.startsWith('image/')) {
		return <Image source={{ uri: attachment.path }} style={styles.image} resizeMode='cover' />;
	}

	return (
		<View style={[styles.preview, { backgroundColor: colors.surfaceNeutral }]}>
			<CustomIcon
				name={attachment.mime?.startsWith('video/') ? 'camera' : 'attach'}
				size={40}
				color={colors.badgeBackgroundLevel2}
			/>
		</View>
	);
};

interface AttachmentActionSheetProps {
	attachment: IShareAttachment;
	onSave: (attachment: Partial<IShareAttachment>) => void;
}

export const AttachmentActionSheet = memo(({ attachment, onSave }: AttachmentActionSheetProps) => {
	'use memo';

	const { colors } = useTheme();
	const { hideActionSheet } = useActionSheet();
	const altTextSupported = useAltTextSupported();
	const [altText, setAltText] = useState(attachment.altText || '');
	const isImage = attachment.mime?.startsWith('image/');
	const showAltTextInput = altTextSupported && isImage;

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={{ paddingTop: 8 }}
			keyboardShouldPersistTaps='handled'
			showsVerticalScrollIndicator={false}>
			<Text numberOfLines={1} style={[styles.title, { color: colors.fontDefault }]}>
				{attachment.filename}
			</Text>
			<View style={[styles.preview, { backgroundColor: colors.surfaceNeutral }]}>
				<Preview attachment={attachment} />
			</View>
			{showAltTextInput ? (
				<>
					<Text style={[styles.label, { color: colors.fontTitlesLabels }]}>{I18n.t('Alt_text')}</Text>
					<Text style={[styles.helper, { color: colors.fontSecondaryInfo }]}>{I18n.t('Alt_text_description')}</Text>
					<TextInput
						accessibilityLabel={I18n.t('Alt_text')}
						multiline
						value={altText}
						onChangeText={setAltText}
						placeholder={I18n.t('Alt_text_placeholder')}
						placeholderTextColor={colors.fontSecondaryInfo}
						style={[
							styles.input,
							{
								color: colors.fontDefault,
								borderColor: colors.strokeLight,
								backgroundColor: colors.surfaceLight
							}
						]}
					/>
				</>
			) : null}
			<Button
				title={I18n.t('Save')}
				onPress={() => {
					onSave({ altText });
					hideActionSheet();
				}}
				style={{ marginBottom: 0 }}
			/>
		</ScrollView>
	);
});

AttachmentActionSheet.displayName = 'AttachmentActionSheet';
