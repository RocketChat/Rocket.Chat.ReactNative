import { StyleSheet, View } from 'react-native';
import { PlainText } from '~/containers/PlainText';

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
			<PlainText style={[styles.title, { color: colors.fontTitlesLabels }]}>{title}</PlainText>
		</View>
	);
};

export default ImageBadge;
