import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PlainText } from 'react-native-plain-text';

import sharedStyles from '~/views/Styles';
import { themes } from '~/lib/constants/colors';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
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

const ListHeader = memo(({ title, translateTitle = true, numberOfLines }: IListHeader) => {
	const { theme } = useTheme();

	return (
		<View style={styles.container}>
			<PlainText
				accessibilityRole='header'
				style={[styles.title, { color: themes[theme].fontHint }]}
				numberOfLines={numberOfLines}>
				{translateTitle ? I18n.t(title) : title}
			</PlainText>
		</View>
	);
});

ListHeader.displayName = 'List.Header';

export default ListHeader;
