import { CustomIcon } from '~/containers/CustomIcon';
import { NativeListRowContent } from '~/containers/NativeListRow';
import Indicator from '~/containers/NativeListRow/components/Indicator';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useTheme } from '~/theme';
import { BASE_HEIGHT, ICON_SIZE } from '~/containers/List/constants';
import { type INativeListItem } from '../types';
import { nativeListItemAccessibilityLabel, nativeListItemSubtitle, nativeListItemTitle } from '../utils/itemProps';
import styles, { ROW_MIN_HEIGHT } from '../styles';

const NativeListItem = ({ item }: INativeListItem) => {
	const { colors } = useTheme();
	const { fontScale } = useResponsiveLayout();
	const minHeight = Math.max(ROW_MIN_HEIGHT, (item.heightContainer ?? BASE_HEIGHT) * fontScale);

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
			leading={item.left?.()}
			trailing={
				<>
					{item.right?.()}
					{item.showActionIndicator ? <Indicator indicator='disclosure' /> : null}
				</>
			}
			onPress={item.onPress ? () => item.onPress?.(item.title) : undefined}
			testID={item.testID}
			accessibilityLabel={nativeListItemAccessibilityLabel(item)}
			accessibilityRole={item.accessibilityRole}
			disabled={item.disabled}
			disabledReason={item.disabledReason}
			style={[styles.row, { minHeight }]}
		/>
	);
};

export default NativeListItem;
