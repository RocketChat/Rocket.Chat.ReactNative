import React, { memo } from 'react';

import I18n from '../../i18n';
import { TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants';
import * as List from '../../containers/List';
import { IBrowsersValues, TValue } from '.';

interface IRenderItem extends IBrowsersValues {
	browser: string | null;
	theme: TSupportedThemes;
	changeDefaultBrowser: (newBrowser: TValue) => void;
}

const Item = memo(({ title, value, browser, changeDefaultBrowser, theme }: IRenderItem) => {
	let isSelected = false;
	if (!browser && value === 'systemDefault:') {
		isSelected = true;
	} else {
		isSelected = browser === value;
	}

	return (
		<List.Item
			title={I18n.t(title, { defaultValue: title })}
			onPress={() => changeDefaultBrowser(value)}
			testID={`default-browser-view-${title}`}
			right={() => (isSelected ? <List.Icon name='check' color={themes[theme].tintColor} /> : null)}
			translateTitle={false}
		/>
	);
});

export default Item;
