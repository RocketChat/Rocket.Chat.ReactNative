import { memo } from 'react';
import { FlatList, Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native-unistyles';

import { BUTTON_HIT_SLOP } from './message/utils';
import { CustomIcon } from './CustomIcon';
import { useTheme } from '../theme';
import { type IShareAttachment } from '../definitions';
import Touch from './Touch';

export const THUMBS_HEIGHT = 74;

const THUMB_SIZE = 64;

const styles = StyleSheet.create(theme => ({
	list: {
		height: THUMBS_HEIGHT,
		paddingHorizontal: 8,
		backgroundColor: theme.colors.surfaceLight
	},
	dangerIcon: {
		position: 'absolute',
		right: 16,
		bottom: 0
	},
	removeButton: {
		position: 'absolute',
		right: -5,
		width: 28,
		height: 28,
		borderWidth: 2,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: theme.colors.fontDefault,
		borderColor: theme.colors.surfaceHover
	},
	removeView: {
		width: 28,
		height: 28,
		borderWidth: 2,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		borderColor: theme.colors.surfaceHover
	},
	item: {
		paddingTop: 8,
		marginRight: 16
	},
	thumb: {
		width: THUMB_SIZE,
		height: THUMB_SIZE,
		borderRadius: 4,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: theme.colors.strokeLight
	}
}));

const ThumbContent = memo(({ path, mime }: { path: string; mime?: string }) => {
	const { colors } = useTheme();

	if (mime?.startsWith('image/')) {
		return <Image source={{ uri: path }} style={styles.thumb} />;
	}

	return (
		<View style={[styles.thumb, { backgroundColor: colors.surfaceNeutral }]}>
			<CustomIcon name={mime?.startsWith('video/') ? 'video' : 'attach'} size={28} color={colors.badgeBackgroundLevel2} />
		</View>
	);
});

interface IThumb {
	item: IShareAttachment;
	onPress(item: IShareAttachment): void;
	onRemove(item: IShareAttachment): void;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	testID?: string;
	removeAccessibilityLabel?: string;
	removeAccessibilityHint?: string;
	removeTestID?: string;
}

interface IThumbs {
	attachments: IShareAttachment[];
	onPress(item: IShareAttachment): void;
	onRemove(item: IShareAttachment): void;
	style?: StyleProp<ViewStyle>;
	contentContainerStyle?: StyleProp<ViewStyle>;
	testID?: string;
	getAccessibilityLabel?: (item: IShareAttachment, index: number) => string | undefined;
	getAccessibilityHint?: (item: IShareAttachment, index: number) => string | undefined;
	getTestID?: (item: IShareAttachment, index: number) => string | undefined;
	getRemoveAccessibilityLabel?: (item: IShareAttachment, index: number) => string | undefined;
	getRemoveAccessibilityHint?: (item: IShareAttachment, index: number) => string | undefined;
	getRemoveTestID?: (item: IShareAttachment, index: number) => string | undefined;
}

const Thumb = ({
	item,
	onPress,
	onRemove,
	accessibilityLabel,
	accessibilityHint,
	testID,
	removeAccessibilityLabel,
	removeAccessibilityHint,
	removeTestID
}: IThumb) => {
	const { colors } = useTheme();
	return (
		<Touch
			style={styles.item}
			onPress={() => onPress(item)}
			activeOpacity={0.7}
			accessible
			accessibilityRole='button'
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			testID={testID}>
			<>
				<ThumbContent path={item.path} mime={item.mime} />
				<RectButton
					hitSlop={BUTTON_HIT_SLOP}
					style={styles.removeButton}
					activeOpacity={1}
					rippleColor={colors.surfaceNeutral}
					onPress={() => onRemove(item)}
					accessibilityLabel={removeAccessibilityLabel}
					accessibilityHint={removeAccessibilityHint}
					testID={removeTestID}>
					<View style={styles.removeView}>
						<CustomIcon name='close' color={colors.surfaceRoom} size={14} />
					</View>
				</RectButton>
				{!item?.canUpload ? (
					<CustomIcon name='warning' size={20} color={colors.buttonBackgroundDangerDefault} style={styles.dangerIcon} />
				) : null}
			</>
		</Touch>
	);
};

const Thumbs = ({
	attachments,
	onPress,
	onRemove,
	style,
	contentContainerStyle,
	testID,
	getAccessibilityLabel,
	getAccessibilityHint,
	getTestID,
	getRemoveAccessibilityLabel,
	getRemoveAccessibilityHint,
	getRemoveTestID
}: IThumbs) => {
	if (!attachments?.length) {
		return null;
	}
	return (
		<FlatList
			horizontal
			data={attachments}
			keyExtractor={item => item.path}
			renderItem={({ item, index }) => (
				<Thumb
					item={item}
					onPress={onPress}
					onRemove={onRemove}
					accessibilityLabel={getAccessibilityLabel?.(item, index)}
					accessibilityHint={getAccessibilityHint?.(item, index)}
					testID={getTestID?.(item, index)}
					removeAccessibilityLabel={getRemoveAccessibilityLabel?.(item, index)}
					removeAccessibilityHint={getRemoveAccessibilityHint?.(item, index)}
					removeTestID={getRemoveTestID?.(item, index)}
				/>
			)}
			showsHorizontalScrollIndicator={false}
			style={[styles.list, style]}
			contentContainerStyle={contentContainerStyle}
			testID={testID}
		/>
	);
};

export default Thumbs;
