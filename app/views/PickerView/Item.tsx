import * as List from '~/containers/List';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import { type IOptionsField } from '../NotificationPreferencesView/options';

export interface IPickerItem {
	item: IOptionsField;
	selected: boolean;
	onItemPress: () => void;
	isFirst: boolean;
	isLast: boolean;
}

const Item = ({ item, selected, onItemPress }: IPickerItem) => {
	const { colors } = useTheme();
	return (
		<List.Item
			title={I18n.t(item.label, { defaultValue: item.label, second: item?.second })}
			right={() => (selected ? <List.Icon name='check' color={colors.badgeBackgroundLevel2} /> : null)}
			onPress={onItemPress}
			translateTitle={false}
			additionalAccessibilityLabel={selected}
			additionalAccessibilityLabelCheck
		/>
	);
};

export default Item;
