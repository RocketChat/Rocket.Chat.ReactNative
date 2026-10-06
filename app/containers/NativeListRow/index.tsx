import { type ReactElement, type ReactNode } from 'react';
import {
	type AccessibilityRole,
	PixelRatio,
	Pressable,
	type StyleProp,
	StyleSheet,
	Text,
	type TextStyle,
	View,
	type ViewStyle
} from 'react-native';

import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { CONTENT_SPACING, ROW_HEIGHT, ROW_MARGIN_HORIZONTAL, ROW_PADDING_HORIZONTAL, ROW_RADIUS } from './constants';

const TRAILING_ACTION_HIT_SLOP = 12;
const SPACER_MIN_LENGTH = 8;

const styles = StyleSheet.create({
	card: {
		marginHorizontal: ROW_MARGIN_HORIZONTAL,
		paddingHorizontal: ROW_PADDING_HORIZONTAL,
		overflow: 'hidden'
	},
	firstCard: {
		borderTopLeftRadius: ROW_RADIUS,
		borderTopRightRadius: ROW_RADIUS
	},
	lastCard: {
		borderBottomLeftRadius: ROW_RADIUS,
		borderBottomRightRadius: ROW_RADIUS
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: CONTENT_SPACING
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'stretch',
		gap: CONTENT_SPACING
	},
	pressed: {
		opacity: 0.75
	},
	disabled: {
		opacity: 0.3
	},
	texts: {
		flex: 1,
		marginRight: SPACER_MIN_LENGTH + CONTENT_SPACING
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4
	},
	title: {
		flexShrink: 1,
		fontSize: 17,
		fontWeight: '500'
	},
	subtitle: {
		fontSize: 15
	}
});

export interface INativeListRowAction {
	icon: TIconsName;
	onPress: () => void;
	testID: string;
	accessibilityLabel: string;
	disabled?: boolean;
}

export interface INativeListRowContent {
	title: ReactNode;
	subtitle?: string;
	leading?: ReactNode;
	titleLeading?: ReactElement;
	titleTrailing?: ReactElement;
	trailing?: ReactNode;
	trailingAction?: INativeListRowAction;
	onPress?: () => void;
	onLongPress?: () => void;
	testID?: string;
	accessibilityLabel: string;
	accessibilityRole?: AccessibilityRole;
	isSelected?: boolean;
	disabled?: boolean;
	titleColor?: string;
	titleNumberOfLines?: number;
	titleStyle?: StyleProp<TextStyle>;
	subtitleSpacing?: number;
	style?: StyleProp<ViewStyle>;
}

export const NativeListRowContent = ({
	title,
	subtitle,
	leading,
	titleLeading,
	titleTrailing,
	trailing,
	trailingAction,
	onPress,
	onLongPress,
	testID,
	accessibilityLabel,
	accessibilityRole = 'button',
	isSelected,
	disabled,
	titleColor,
	titleNumberOfLines = 1,
	titleStyle,
	subtitleSpacing,
	style
}: INativeListRowContent) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.row, style]}>
			<Pressable
				onPress={onPress}
				onLongPress={onLongPress}
				disabled={disabled}
				testID={testID}
				accessible={Boolean(onPress || onLongPress)}
				accessibilityRole={accessibilityRole}
				accessibilityLabel={accessibilityLabel}
				accessibilityState={{ selected: isSelected, disabled }}
				style={({ pressed }) => [styles.content, pressed && onPress && styles.pressed, disabled && styles.disabled]}>
				{leading}
				<View style={[styles.texts, { gap: subtitleSpacing }]}>
					<View style={styles.titleRow}>
						{titleLeading}
						{typeof title === 'string' ? (
							<Text
								numberOfLines={titleNumberOfLines}
								style={[styles.title, { color: titleColor ?? colors.fontDefault }, titleStyle]}>
								{title}
							</Text>
						) : (
							title
						)}
						{titleTrailing}
					</View>
					{subtitle ? (
						<Text numberOfLines={1} style={[styles.subtitle, { color: colors.fontSecondaryInfo }]}>
							{subtitle}
						</Text>
					) : null}
				</View>
				{trailing}
			</Pressable>
			{trailingAction ? (
				<Pressable
					onPress={trailingAction.onPress}
					disabled={trailingAction.disabled}
					testID={trailingAction.testID}
					accessibilityRole='button'
					accessibilityLabel={trailingAction.accessibilityLabel}
					hitSlop={TRAILING_ACTION_HIT_SLOP}>
					<CustomIcon
						name={trailingAction.icon}
						size={20}
						color={trailingAction.disabled ? colors.fontDisabled : colors.fontDefault}
					/>
				</Pressable>
			) : null}
		</View>
	);
};

export interface INativeListRow extends Omit<INativeListRowContent, 'title' | 'titleStyle' | 'style'> {
	title: string;
	onPress: () => void;
	testID: string;
	isFirst?: boolean;
	isLast?: boolean;
}

const NativeListRow = ({
	title,
	subtitle,
	leading,
	titleLeading,
	trailing,
	trailingAction,
	onPress,
	onLongPress,
	testID,
	accessibilityLabel,
	isSelected,
	isFirst,
	isLast,
	disabled
}: INativeListRow) => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();
	const height = PixelRatio.roundToNearestPixel(ROW_HEIGHT * fontScale);

	return (
		<NativeListRowContent
			title={title}
			subtitle={subtitle}
			leading={leading}
			titleLeading={titleLeading}
			trailing={trailing}
			trailingAction={trailingAction}
			onPress={onPress}
			onLongPress={onLongPress}
			testID={testID}
			accessibilityLabel={accessibilityLabel}
			isSelected={isSelected}
			disabled={disabled}
			style={[
				styles.card,
				{ height, backgroundColor: colors.surfaceLight },
				isFirst && styles.firstCard,
				isLast && styles.lastCard
			]}
		/>
	);
};

export default NativeListRow;
