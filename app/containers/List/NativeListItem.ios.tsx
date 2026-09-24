import { I18nManager, StyleSheet, View } from 'react-native';
import { ListItem } from '@expo/ui';
import { HStack, RNHostView, Text } from '@expo/ui/swift-ui';
import {
	accessibilityLabel,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	listRowInsets,
	opacity,
	type ModifierConfig
} from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { CustomIcon } from '../CustomIcon';
import ListIcon from './ListIcon';
import { BASE_HEIGHT, ICON_SIZE, PADDING_HORIZONTAL } from './constants';
import {
	type INativeListItem,
	nativeListItemAccessibilityLabel,
	nativeListItemSubtitle,
	nativeListItemTitle,
	pressNativeListItem
} from './nativeListItemProps';

const styles = StyleSheet.create({
	trailing: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	chevron: {
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	}
});

interface INativeListItemRow {
	item: INativeListItem;
	modifiers: ModifierConfig[];
}

const NativeListItem = ({ item, modifiers }: INativeListItemRow) => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();
	const subtitle = nativeListItemSubtitle(item);
	const hasTrailing = Boolean(item.right || item.showActionIndicator);

	return (
		<ListItem
			onPress={() => pressNativeListItem(item)}
			testID={item.testID}
			modifiers={[
				accessibilityLabel(nativeListItemAccessibilityLabel(item)),
				frame({ minHeight: (item.heightContainer ?? BASE_HEIGHT) * fontScale }),
				listRowInsets({ leading: PADDING_HORIZONTAL, trailing: PADDING_HORIZONTAL }),
				...(item.disabled ? [opacity(0.3)] : []),
				...modifiers
			]}
			leading={item.left ? item.left() : undefined}
			trailing={
				hasTrailing ? (
					<View style={styles.trailing}>
						{item.right ? item.right() : null}
						{item.showActionIndicator ? <ListIcon name='chevron-right' style={styles.chevron} /> : null}
					</View>
				) : undefined
			}
			supportingText={
				subtitle ? (
					<Text modifiers={[lineLimit(1), font({ size: 14 }), foregroundStyle(colors.fontSecondaryInfo)]}>{subtitle}</Text>
				) : undefined
			}>
			<HStack spacing={4}>
				<Text
					modifiers={[
						item.numberOfLines ? lineLimit(item.numberOfLines) : lineLimit(),
						font({ size: 16, weight: 'medium' }),
						foregroundStyle(item.color ?? colors.fontDefault)
					]}>
					{nativeListItemTitle(item)}
				</Text>
				{item.alert ? (
					<RNHostView matchContents>
						<CustomIcon name='info' size={ICON_SIZE} color={colors.buttonBackgroundDangerDefault} />
					</RNHostView>
				) : null}
			</HStack>
		</ListItem>
	);
};

export default NativeListItem;
