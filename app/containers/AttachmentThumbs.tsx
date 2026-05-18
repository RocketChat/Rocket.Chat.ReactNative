import React from 'react';
import { FlatList, type ListRenderItem, Pressable, StyleSheet, type StyleProp, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import { type IShareAttachment } from '../definitions';
import { AttachmentThumb } from './AttachmentThumb';
import { CustomIcon } from './CustomIcon';
import { BUTTON_HIT_SLOP } from './message/utils';

const styles = StyleSheet.create({
	item: {
		marginRight: 16
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

interface IAttachmentThumbItem {
	item: IShareAttachment;
	index: number;
	onPress(item: IShareAttachment): void;
	onRemove(item: IShareAttachment): void;
	getItemAccessibilityLabel?: (item: IShareAttachment) => string | undefined;
	getItemAccessibilityHint?: (item: IShareAttachment) => string | undefined;
	removeAccessibilityLabel?: string;
	getItemTestID?: (item: IShareAttachment, index: number) => string | undefined;
	getRemoveTestID?: (item: IShareAttachment, index: number) => string | undefined;
}

const AttachmentThumbItem = ({
	item,
	index,
	onPress,
	onRemove,
	getItemAccessibilityLabel,
	getItemAccessibilityHint,
	removeAccessibilityLabel,
	getItemTestID,
	getRemoveTestID
}: IAttachmentThumbItem) => {
	'use memo';

	const { colors } = useTheme();

	return (
		<View style={styles.item}>
			<Pressable
				style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
				accessible
				accessibilityRole='button'
				accessibilityLabel={getItemAccessibilityLabel?.(item) ?? item.filename}
				accessibilityHint={getItemAccessibilityHint?.(item)}
				onPress={() => onPress(item)}
				testID={getItemTestID?.(item, index)}>
				<AttachmentThumb path={item.path} mime={item.mime} />
			</Pressable>
			<Pressable
				accessible
				accessibilityRole='button'
				accessibilityLabel={removeAccessibilityLabel}
				hitSlop={BUTTON_HIT_SLOP}
				style={({ pressed }) => [
					styles.removeButton,
					{
						backgroundColor: colors.fontDefault,
						borderColor: colors.surfaceRoom,
						opacity: pressed ? 0.7 : 1
					}
				]}
				onPress={() => onRemove(item)}
				testID={getRemoveTestID?.(item, index)}>
				<CustomIcon name='close' color={colors.surfaceRoom} size={14} />
			</Pressable>
			{!item.canUpload ? (
				<CustomIcon name='warning' size={18} color={colors.buttonBackgroundDangerDefault} style={styles.warningIcon} />
			) : null}
		</View>
	);
};

interface IAttachmentThumbs extends Omit<IAttachmentThumbItem, 'item' | 'index'> {
	attachments: IShareAttachment[];
	testID?: string;
	style?: StyleProp<ViewStyle>;
	contentContainerStyle?: StyleProp<ViewStyle>;
}

const keyExtractor = (item: IShareAttachment) => item.path;

export const AttachmentThumbs = ({
	attachments,
	onPress,
	onRemove,
	getItemAccessibilityLabel,
	getItemAccessibilityHint,
	removeAccessibilityLabel,
	getItemTestID,
	getRemoveTestID,
	testID,
	style,
	contentContainerStyle
}: IAttachmentThumbs) => {
	const renderItem: ListRenderItem<IShareAttachment> = ({ item, index }) => (
		<AttachmentThumbItem
			item={item}
			index={index}
			onPress={onPress}
			onRemove={onRemove}
			getItemAccessibilityLabel={getItemAccessibilityLabel}
			getItemAccessibilityHint={getItemAccessibilityHint}
			removeAccessibilityLabel={removeAccessibilityLabel}
			getItemTestID={getItemTestID}
			getRemoveTestID={getRemoveTestID}
		/>
	);

	return (
		<FlatList
			horizontal
			data={attachments}
			keyExtractor={keyExtractor}
			style={style}
			contentContainerStyle={contentContainerStyle}
			showsHorizontalScrollIndicator={false}
			testID={testID}
			renderItem={renderItem}
		/>
	);
};
