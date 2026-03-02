import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants/colors';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { PADDING_HORIZONTAL } from './constants';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
		paddingHorizontal: PADDING_HORIZONTAL
	},
	title: {
		...sharedStyles.textRegular
	}
});

interface IListHeader {
	title: string;
	translateTitle?: boolean;
	numberOfLines?: number;
}

const ListHeader = React.memo(({ title, translateTitle = true, numberOfLines }: IListHeader) => {
	'use memo';

	const { theme } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();

	return (
		<View style={styles.container}>
			<Text accessibilityRole='header' style={[styles.title, { color: themes[theme].fontHint, fontSize: scaleFontSize(16) }]} numberOfLines={numberOfLines}>
				{translateTitle ? I18n.t(title) : title}
			</Text>
		</View>
	);
});

ListHeader.displayName = 'List.Header';

export default ListHeader;
