import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { themes } from '../../constants/colors';
import { useTheme } from '../../theme';

const styles = StyleSheet.create({
	separator: {
		height: StyleSheet.hairlineWidth
	}
});

interface IListSeparator {
	style?: ViewStyle;
}

const ListSeparator = React.memo(({ style }: IListSeparator) => {
	const { theme } = useTheme();

	return <View style={[styles.separator, style, { backgroundColor: themes[theme].separatorColor }]} />;
});

ListSeparator.displayName = 'List.Separator';

export default ListSeparator;
