import { type ReactElement, type ReactNode } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';

import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { CONTENT_SPACING, ROW_HEIGHT, ROW_MARGIN_HORIZONTAL, ROW_PADDING_HORIZONTAL, ROW_RADIUS } from './constants';

const TRAILING_ACTION_HIT_SLOP = 12;
const SPACER_MIN_LENGTH = 8;

const styles = StyleSheet.create({
	card: {
		marginHorizontal: ROW_MARGIN_HORIZONTAL,
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
		paddingHorizontal: ROW_PADDING_HORIZONTAL,
		gap: CONTENT_SPACING
	},
	pressable: {
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

export interface INativeListRow {
	title: string;
	subtitle?: string;
	leading?: ReactNode;
	titleLeading?: ReactElement;
	trailing?: ReactNode;
	trailingAction?: INativeListRowAction;
	onPress: () => void;
	onLongPress?: () => void;
	testID: string;
	accessibilityLabel: string;
	isSelected?: boolean;
	isFirst?: boolean;
	isLast?: boolean;
	disabled?: boolean;
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
		<View style={[styles.card, { backgroundColor: colors.surfaceLight }, isFirst && styles.firstCard, isLast && styles.lastCard]}>
			<Pressable
				onPress={onPress}
				onLongPress={onLongPress}
				disabled={disabled}
				testID={testID}
				accessibilityRole='button'
				accessibilityLabel={accessibilityLabel}
				accessibilityState={{ selected: isSelected, disabled }}
				style={[styles.row, { height }]}>
				{({ pressed }) => (
					<>
						<View style={[styles.pressable, pressed && styles.pressed, disabled && styles.disabled]}>
							{leading}
							<View style={styles.texts}>
								<View style={styles.titleRow}>
									{titleLeading}
									<Text numberOfLines={1} style={[styles.title, { color: colors.fontDefault }]}>
										{title}
									</Text>
								</View>
								{subtitle ? (
									<Text numberOfLines={1} style={[styles.subtitle, { color: colors.fontSecondaryInfo }]}>
										{subtitle}
									</Text>
								) : null}
							</View>
							{trailing}
						</View>
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
					</>
				)}
			</Pressable>
		</View>
	);
};

export default NativeListRow;
