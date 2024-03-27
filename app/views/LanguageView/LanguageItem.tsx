import React from 'react';

import * as List from '../../containers/List';
import { useTheme } from '../../theme';

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

	return (
		<List.Item
			title={label}
			onPress={() => submit(value)}
			testID={`language-view-${value}`}
			right={() => (isSelected ? <List.Icon name='check' color={colors.badgeBackgroundLevel2} /> : null)}
			translateTitle={false}
		/>
	);
};

export default LanguageItem;
