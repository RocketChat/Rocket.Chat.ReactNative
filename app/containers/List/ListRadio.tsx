import React from 'react';

import i18n from '../../i18n';
import ListItem, { IListItem } from './ListItem';
import ListIcon from './ListIcon';
import { useTheme } from '../../theme';

interface IListRadio extends IListItem {
	value: any;
	testId: string;
	isSelected: boolean;
	onChange: (value: any) => void | Promise<void>;
}

const ListRadio = ({ value, testId, isSelected, onChange, ...rest }: IListRadio) => {
	const { colors } = useTheme();

	const iconName = isSelected ? 'radio-checked' : 'radio-unchecked';
	const iconColor = isSelected ? colors.badgeBackgroundLevel2 : colors.strokeMedium;

	return (
		<ListItem
			{...rest}
			onPress={() => onChange(value)}
			right={() => <ListIcon name={iconName} color={iconColor} />}
			additionalAcessibilityLabel={isSelected ? i18n.t('Selected') : i18n.t('Unselected')}
			accessibilityRole='radio'
		/>
	);
};

export default ListRadio;
