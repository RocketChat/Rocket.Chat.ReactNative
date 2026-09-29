import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-plain-text';

import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';

const styles = StyleSheet.create({
	container: {
		padding: 4,
		borderRadius: 4
	},
	title: {
		...sharedStyles.textBold
	}
});

interface IImageBadge {
	title: string;
}

const ImageBadge = ({ title }: IImageBadge) => {
	const { colors } = useTheme();
	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceNeutral }]}>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{title}</Text>
		</View>
	);
};

export default ImageBadge;
