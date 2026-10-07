import { CustomIcon } from '~/containers/CustomIcon';
import { NativeListRowContent } from '~/containers/NativeListRow';
import Indicator from '~/containers/NativeListRow/components/Indicator';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useTheme } from '~/theme';
import { BASE_HEIGHT, ICON_SIZE } from '~/containers/List/constants';
import { type INativeListItem } from '../types';
import { describeNativeListAccessory } from '../utils/describeAccessory';
import {
	nativeListItemAccessibilityLabel,
	nativeListItemSubtitle,
	nativeListItemTitle,
	pressNativeListItem
} from '../utils/itemProps';
import NativeListAccessory from './Accessory';
import styles, { ROW_MIN_HEIGHT } from '../styles';

const NativeListItem = ({ item }: INativeListItem) => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();
	const leading = describeNativeListAccessory(item.left?.());
	const trailing = describeNativeListAccessory(item.right?.());
	const minHeight = Math.max(ROW_MIN_HEIGHT, (item.heightContainer ?? BASE_HEIGHT) * fontScale);
	const showsDisabledReason = Boolean(item.disabled && item.disabledReason);

	return (
		<NativeListRowContent
			title={typeof item.title === 'function' ? item.title() : nativeListItemTitle(item)}
			subtitle={nativeListItemSubtitle(item)}
			subtitleSpacing={2}
			titleColor={item.color}
			titleNumberOfLines={item.numberOfLines ?? 0}
			titleStyle={styles.title}
			titleTrailing={
				item.alert ? <CustomIcon name='info' size={ICON_SIZE} color={colors.buttonBackgroundDangerDefault} /> : undefined
			}
			leading={leading ? <NativeListAccessory accessory={leading} /> : null}
			trailing={
				<>
					{trailing ? <NativeListAccessory accessory={trailing} /> : null}
					{item.showActionIndicator ? <Indicator indicator='disclosure' /> : null}
				</>
			}
			onPress={item.onPress ? () => pressNativeListItem(item) : undefined}
			testID={item.testID}
			accessibilityLabel={nativeListItemAccessibilityLabel(item)}
			accessibilityRole={item.accessibilityRole}
			disabled={item.disabled && !showsDisabledReason}
			style={[styles.row, { minHeight }, showsDisabledReason && styles.disabled]}
		/>
	);
};

export default NativeListItem;
