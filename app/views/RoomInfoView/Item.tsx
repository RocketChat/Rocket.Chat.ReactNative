import React from 'react';
import { Text, View } from 'react-native';

import Markdown from '../../containers/markdown';
import { useTheme } from '../../theme';
import styles from './styles';

interface IItem {
	label?: string;
	content?: string;
	testID?: string;
}

const Item = ({ label, content, testID }: IItem): React.ReactElement | null => {
	const { colors } = useTheme();

	if (!content) return null;

	return (
		<View style={styles.item} testID={testID}>
			<Text accessibilityLabel={label} style={[styles.itemLabel, { color: colors.fontTitlesLabels }]}>
				{label}
			</Text>
			<Markdown style={[styles.itemContent, { color: colors.fontSecondaryInfo }]} msg={content} />
		</View>
	);
};

export default Item;
