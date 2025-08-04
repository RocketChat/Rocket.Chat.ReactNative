import React from 'react';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import * as List from '../../containers/List';
import { IBrowsersValues, TValue } from '.';

interface IRenderItem extends IBrowsersValues {
	browser: string | null;
	changeDefaultBrowser: (newBrowser: TValue) => void;
}

const Item = ({ title, value, browser, changeDefaultBrowser }: IRenderItem) => {
	const { colors } = useTheme();

	let isSelected = false;
	if (!browser && value === 'systemDefault:') {
		isSelected = true;
	} else {
		isSelected = browser === value;
	}

	const iconName = isSelected ? 'radio-checked' : 'radio-unchecked';
	const iconColor = isSelected ? colors.badgeBackgroundLevel2 : colors.strokeMedium;

	return (
		<List.Item
			title={I18n.t(title, { defaultValue: title })}
			onPress={() => changeDefaultBrowser(value)}
			testID={`default-browser-view-${title}`}
			right={() => <List.Icon name={iconName} color={iconColor} />}
			translateTitle={false}
			additionalAcessibilityLabel={isSelected ? I18n.t('Selected') : I18n.t('Unselected')}
			accessibilityRole='radio'
		/>
	);
};

export default Item;
