import { memo } from 'react';
import { View, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

const styles = StyleSheet.create(theme => ({
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: theme.colors.strokeLight
	}
}));

interface IListSeparator {
	style?: ViewStyle;
}

const ListSeparator = memo(({ style }: IListSeparator) => {
	'use memo';

	return <View style={[styles.separator, style]} />;
});

ListSeparator.displayName = 'List.Separator';

export default ListSeparator;
