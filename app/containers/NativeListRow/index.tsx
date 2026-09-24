import { type ReactElement, type ReactNode } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { Host, ListItem } from '@expo/ui';
import { Button, HStack, Image, RNHostView, Text } from '@expo/ui/swift-ui';
import {
	accessibilityAddTraits,
	accessibilityLabel as accessibilityLabelModifier,
	buttonStyle,
	disabled as disabledModifier,
	font,
	foregroundStyle,
	lineLimit,
	onLongPressGesture,
	padding
} from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { CONTENT_SPACING, ROW_HEIGHT, ROW_MARGIN_HORIZONTAL, ROW_PADDING_HORIZONTAL, ROW_RADIUS } from './constants';

const styles = StyleSheet.create({
	card: {
		marginHorizontal: ROW_MARGIN_HORIZONTAL
	},
	firstCard: {
		borderTopLeftRadius: ROW_RADIUS,
		borderTopRightRadius: ROW_RADIUS
	},
	lastCard: {
		borderBottomLeftRadius: ROW_RADIUS,
		borderBottomRightRadius: ROW_RADIUS
	},
	host: {
		width: '100%'
	}
});

export interface INativeListRowAction {
	systemImage: 'phone';
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
	isLast
}: INativeListRow) => {
	const { colors, theme } = useTheme();
	const { fontScale } = useResponsiveLayout();
	const height = PixelRatio.roundToNearestPixel(ROW_HEIGHT * fontScale);
	const rowModifiers = [
		accessibilityLabelModifier(accessibilityLabel),
		...(isSelected ? [accessibilityAddTraits(['isSelected'])] : []),
		...(onLongPress ? [onLongPressGesture(onLongPress)] : [])
	];
	const titleText = (
		<Text modifiers={[lineLimit(1), font({ size: 16, weight: 'medium' }), foregroundStyle(colors.fontDefault)]}>{title}</Text>
	);

	return (
		<View style={[styles.card, { backgroundColor: colors.surfaceLight }, isFirst && styles.firstCard, isLast && styles.lastCard]}>
			<Host style={[styles.host, { height }]} colorScheme={theme === 'light' ? 'light' : 'dark'} ignoreSafeArea='all'>
				<HStack spacing={CONTENT_SPACING} modifiers={[padding({ horizontal: ROW_PADDING_HORIZONTAL })]}>
					<ListItem
						onPress={onPress}
						testID={testID}
						modifiers={rowModifiers}
						leading={leading}
						trailing={trailing}
						supportingText={
							subtitle ? (
								<Text modifiers={[lineLimit(1), font({ size: 14 }), foregroundStyle(colors.fontSecondaryInfo)]}>{subtitle}</Text>
							) : undefined
						}>
						{titleLeading ? (
							<HStack spacing={4}>
								<RNHostView matchContents>{titleLeading}</RNHostView>
								{titleText}
							</HStack>
						) : (
							titleText
						)}
					</ListItem>
					{trailingAction ? (
						<Button
							onPress={trailingAction.onPress}
							testID={trailingAction.testID}
							modifiers={[
								buttonStyle('borderless'),
								disabledModifier(Boolean(trailingAction.disabled)),
								accessibilityLabelModifier(trailingAction.accessibilityLabel)
							]}>
							<Image
								systemName={trailingAction.systemImage}
								size={20}
								color={trailingAction.disabled ? colors.fontDisabled : colors.fontDefault}
							/>
						</Button>
					) : null}
				</HStack>
			</Host>
		</View>
	);
};

export default NativeListRow;
