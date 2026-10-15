import type { ViewStyle } from 'react-native';

import i18n from '~/i18n';
import ListItem, { type IListItem } from './ListItem';
import ListIcon from './ListIcon';
import { useTheme } from '~/theme';
import Radio from '~/containers/Radio';
import { useIsNativeList } from '../native/context';

interface IListRadio extends IListItem {
	value: any;
	isSelected: boolean;
	style?: ViewStyle;
}

const ListRadio = ({ value: _, isSelected, ...rest }: IListRadio) => {
	const { colors } = useTheme();
	const isNativeList = useIsNativeList();

	const iconName = isSelected ? 'radio-checked' : 'radio-unchecked';
	const iconColor = isSelected ? colors.badgeBackgroundLevel2 : colors.strokeMedium;

	return (
		<ListItem
			{...rest}
			right={() => (isNativeList ? <Radio check={isSelected} /> : <ListIcon name={iconName} color={iconColor} />)}
			additionalAccessibilityLabel={isSelected ? i18n.t('Selected') : i18n.t('Unselected')}
			accessibilityRole='radio'
		/>
	);
};

export default ListRadio;
