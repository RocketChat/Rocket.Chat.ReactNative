import React from 'react';

import * as List from '../../containers/List';
import { useTheme } from '../../theme';
import i18n from '../../i18n';

const LanguageItem = ({
	item,
	language,
	submit
}: {
	item: { value: string; label: string };
	language: string;
	submit: (language: string) => Promise<void>;
}) => {
	const { colors } = useTheme();

	const { value, label } = item;
	const isSelected = language === value;

	const iconName = isSelected ? 'radio-checked' : 'radio-unchecked';
	const iconColor = isSelected ? colors.badgeBackgroundLevel2 : colors.strokeMedium;

	return (
		<List.Item
			title={label}
			onPress={() => submit(value)}
			testID={`language-view-${value}`}
			right={() => <List.Icon name={iconName} color={iconColor} />}
			translateTitle={false}
			additionalAcessibilityLabel={isSelected ? i18n.t('Selected') : i18n.t('Unselected')}
			accessibilityRole='radio'
		/>
	);
};

export default LanguageItem;
