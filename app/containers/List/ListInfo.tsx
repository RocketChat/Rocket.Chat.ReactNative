import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';
import { PADDING_HORIZONTAL } from './constants';
import I18n from '../../i18n';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const styles = StyleSheet.create({
	container: {
		paddingTop: 8,
		paddingHorizontal: PADDING_HORIZONTAL
	},
	text: {
		...sharedStyles.textRegular
	}
});

interface IListInfo {
	info: string;
	translateInfo?: boolean;
}

const ListInfo = React.memo(({ info, translateInfo = true }: IListInfo) => {
	'use memo';

	const { theme } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	return (
		<View style={styles.container}>
			<Text style={[styles.text, { color: themes[theme].fontHint, fontSize: scaleFontSize(14), lineHeight: scaleFontSize(20) }]}>{translateInfo ? I18n.t(info) : info}</Text>
		</View>
	);
});

ListInfo.displayName = 'List.Info';

export default ListInfo;
