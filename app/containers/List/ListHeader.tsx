import { memo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../views/Styles';
import I18n from '../../i18n';
import { PADDING_HORIZONTAL } from './constants';

const styles = StyleSheet.create(theme => ({
	container: {
		paddingVertical: 8,
		paddingHorizontal: PADDING_HORIZONTAL
	},
	title: {
		fontSize: 16,
		...sharedStyles.textRegular,
		color: theme.colors.fontHint
	}
}));

interface IListHeader {
	title: string;
	translateTitle?: boolean;
	numberOfLines?: number;
}

const ListHeader = memo(({ title, translateTitle = true, numberOfLines }: IListHeader) => {
	'use memo';

	return (
		<View style={styles.container}>
			<Text accessibilityRole='header' style={styles.title} numberOfLines={numberOfLines}>
				{translateTitle ? I18n.t(title) : title}
			</Text>
		</View>
	);
});

ListHeader.displayName = 'List.Header';

export default ListHeader;
