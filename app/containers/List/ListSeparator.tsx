import { memo, useContext } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { themes } from '~/lib/constants/colors';
import { useTheme } from '~/theme';
import { NativeListContext } from './native/context';

const styles = StyleSheet.create({
	separator: {
		height: StyleSheet.hairlineWidth
	}
});

interface IListSeparator {
	style?: ViewStyle;
}

const ListSeparator = memo(({ style }: IListSeparator) => {
	const { theme } = useTheme();
	const isInNativeList = useContext(NativeListContext);

	if (isInNativeList) {
		return null;
	}

	return <View style={[styles.separator, style, { backgroundColor: themes[theme].strokeLight }]} />;
});

ListSeparator.displayName = 'List.Separator';

export default ListSeparator;
