import * as List from '~/containers/List';
import NativeListRow from '~/containers/NativeListRow';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import { type IPickerItem } from './Item';

const Item = ({ item, selected, onItemPress, isFirst, isLast }: IPickerItem) => {
	const { colors } = useTheme();
	const title = I18n.t(item.label, { defaultValue: item.label, second: item?.second });
	return (
		<NativeListRow
			title={title}
			onPress={onItemPress}
			testID={`picker-view-item-${item.value}`}
			accessibilityLabel={`${title} ${selected ? I18n.t('Checked') : I18n.t('Unchecked')}`}
			isSelected={selected}
			isFirst={isFirst}
			isLast={isLast}
			trailing={selected ? <List.Icon name='check' color={colors.badgeBackgroundLevel2} /> : undefined}
		/>
	);
};

export default Item;
