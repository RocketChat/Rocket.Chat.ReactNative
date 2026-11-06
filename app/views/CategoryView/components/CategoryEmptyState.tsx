import { StyleSheet, Text, View } from 'react-native';

import i18n from '~/i18n';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';

const CategoryEmptyState = () => {
	const { colors } = useTheme();

	return (
		<View style={styles.container} testID='category-view-empty'>
			<Text style={[styles.title, { color: colors.fontDefault }]}>{i18n.t('Empty_category')}</Text>
			<Text style={[styles.description, { color: colors.fontHint }]}>{i18n.t('No_rooms_in_category')}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: 32,
		paddingHorizontal: 48,
		gap: 8
	},
	title: {
		fontSize: 20,
		lineHeight: 30,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

export default CategoryEmptyState;
