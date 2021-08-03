import React from 'react';
import { View, StyleSheet } from 'react-native';

import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';

const styles = StyleSheet.create({
	separator: {
		height: StyleSheet.hairlineWidth
	}
});

interface IListSeparator {
	style: object;
	theme: string;
}

const ListSeparator = React.memo(({ style, theme }: IListSeparator) => (
	<View
		style={[
			styles.separator,
			style,
			{ backgroundColor: themes[theme].separatorColor }
		]}
	/>
));

ListSeparator.displayName = 'List.Separator';

export default withTheme(ListSeparator);
