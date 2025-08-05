import React from 'react';

import i18n from '../../i18n';
import ListItem from './ListItem';
import ListIcon from './ListIcon';
import { useTheme } from '../../theme';

const ListRadio = ({
	label,
	value,
	testId,
	isSelected,
	onChange
}: {
	value: any;
	label: string;
	testId: string;
	isSelected: boolean;
	onChange: (value: any) => void | Promise<void>;
}) => {
	const { colors } = useTheme();

	const iconName = isSelected ? 'radio-checked' : 'radio-unchecked';
	const iconColor = isSelected ? colors.badgeBackgroundLevel2 : colors.strokeMedium;

	return (
		<ListItem
			title={label}
			onPress={() => onChange(value)}
			testID={testId}
			right={() => <ListIcon name={iconName} color={iconColor} />}
			translateTitle={false}
			additionalAcessibilityLabel={isSelected ? i18n.t('Selected') : i18n.t('Unselected')}
			accessibilityRole='radio'
		/>
	);
};

export default ListRadio;
