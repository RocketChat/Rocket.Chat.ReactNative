import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { PADDING_HORIZONTAL } from './constants';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
		paddingHorizontal: PADDING_HORIZONTAL
	},
	title: {
		fontSize: 16,
		...sharedStyles.textRegular
	}
});

interface IListHeader {
	title: string;
	translateTitle?: boolean;
	numberOfLines?: number;
}

const ListHeader = React.memo(({ title, translateTitle = true, numberOfLines = 1 }: IListHeader) => {
	const { theme } = useTheme();

	return (
		<View style={styles.container}>
			<Text accessibilityRole='header' style={[styles.title, { color: themes[theme].fontHint }]} numberOfLines={numberOfLines}>
				{translateTitle ? I18n.t(title) : title}
			</Text>
		</View>
	);
});

ListHeader.displayName = 'List.Header';

export default ListHeader;
