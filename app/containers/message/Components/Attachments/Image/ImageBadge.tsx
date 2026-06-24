import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../../../../views/Styles';

const styles = StyleSheet.create(theme => ({
	container: {
		padding: 4,
		borderRadius: 4,
		backgroundColor: theme.colors.surfaceNeutral
	},
	title: {
		...sharedStyles.textBold,
		color: theme.colors.fontTitlesLabels
	}
}));

interface IImageBadge {
	title: string;
}

const ImageBadge = ({ title }: IImageBadge) => {
	'use memo';

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{title}</Text>
		</View>
	);
};

export default ImageBadge;
