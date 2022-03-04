import React from 'react';
import { Text, View } from 'react-native';

import Markdown from '../../containers/markdown';
import { themes } from '../../constants/colors';
import { useTheme } from '../../theme';
import styles from './styles';

interface IItem {
	label?: string;
	content?: string;
	testID?: string;
}

const Item = ({ label, content, testID }: IItem) => {
	const { theme } = useTheme();

	if (!content) {
		return null;
	}

	return (
		<View style={styles.item} testID={testID}>
			<Text accessibilityLabel={label} style={[styles.itemLabel, { color: themes[theme].titleText }]}>
				{label}
			</Text>
			<Markdown style={[styles.itemContent, { color: themes[theme].auxiliaryText }]} msg={content} theme={theme} />
		</View>
	);
};

export default Item;
