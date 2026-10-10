import { memo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { themes } from '~/lib/constants/colors';
import { useTheme } from '~/theme';
import { useIsNativeList } from '../native/context';

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
	const isNativeList = useIsNativeList();

	if (isNativeList) {
		return null;
	}

	return <View style={[styles.separator, style, { backgroundColor: themes[theme].strokeLight }]} />;
});

ListSeparator.displayName = 'List.Separator';

export default ListSeparator;
