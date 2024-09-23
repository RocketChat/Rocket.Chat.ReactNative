import React from 'react';
import { StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';

import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	separator: {
		height: 1
	}
});

interface IListSeparator {
	style?: ViewStyle;
	spaceOn?: 'left' | 'right';
	spaceSize?: number;
}

const ListSeparator = React.memo(({ style, spaceOn, spaceSize }: IListSeparator) => {
	const { theme } = useTheme();
	const { width } = useWindowDimensions();

	return (
		<View style={[styles.container, {alignItems: spaceOn === 'left' ? 'flex-end' : 'flex-start'}]}>
			<View style={[styles.separator, style, { backgroundColor: themes[theme].strokeLight,	width: width - (spaceSize ?? 0) }]} />
		</View>
	)
});

ListSeparator.displayName = 'List.Separator';

export default ListSeparator;
