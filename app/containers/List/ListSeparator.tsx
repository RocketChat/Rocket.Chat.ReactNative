import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { themes } from '../../lib/constants';
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

	return <View style={[styles.separator, style, { backgroundColor: themes[theme].strokeLight }]} />;
});

ListSeparator.displayName = 'List.Separator';

export default ListSeparator;
