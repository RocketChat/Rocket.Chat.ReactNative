import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import { PADDING_HORIZONTAL } from './constants';
import I18n from '../../i18n';

const styles = StyleSheet.create({
	container: {
		paddingTop: 8,
		paddingHorizontal: PADDING_HORIZONTAL
	},
	text: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	}
});

interface IListInfo {
	info: string;
	translateInfo?: boolean;
}

const ListInfo = React.memo(({ info, translateInfo = true }: IListInfo) => {
	const { theme } = useTheme();
	return (
		<View style={styles.container}>
			<Text style={[styles.text, { color: themes[theme].fontHint }]}>{translateInfo ? I18n.t(info) : info}</Text>
		</View>
	);
});

ListInfo.displayName = 'List.Info';

export default ListInfo;
