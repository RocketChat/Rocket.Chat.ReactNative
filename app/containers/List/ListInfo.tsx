import { memo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../views/Styles';
import { PADDING_HORIZONTAL } from './constants';
import I18n from '../../i18n';

const styles = StyleSheet.create(theme => ({
	container: {
		paddingTop: 8,
		paddingHorizontal: PADDING_HORIZONTAL
	},
	text: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular,
		color: theme.colors.fontHint
	}
}));

interface IListInfo {
	info: string;
	translateInfo?: boolean;
}

const ListInfo = memo(({ info, translateInfo = true }: IListInfo) => {
	'use memo';

	return (
		<View style={styles.container}>
			<Text style={styles.text}>{translateInfo ? I18n.t(info) : info}</Text>
		</View>
	);
});

ListInfo.displayName = 'List.Info';

export default ListInfo;
