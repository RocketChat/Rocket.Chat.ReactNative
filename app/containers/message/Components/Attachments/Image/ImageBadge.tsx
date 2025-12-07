import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import sharedStyles from '../../../../../views/Styles';
import { useTheme } from '../../../../../theme';

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
	'use memo';

	const { colors } = useTheme();
	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceNeutral }]}>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{title}</Text>
		</View>
	);
};

export default ImageBadge;
