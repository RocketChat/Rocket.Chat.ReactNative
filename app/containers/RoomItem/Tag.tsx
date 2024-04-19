import React from 'react';
import { Text, View } from 'react-native';

import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import styles from './styles';

interface ITag {
	name: string;
	testID?: string;
}

const Tag = React.memo(({ name, testID }: ITag) => {
	const { theme } = useTheme();

	return (
		<View style={[styles.tagContainer, { backgroundColor: themes[theme].strokeLight }]}>
			<Text style={[styles.tagText, { color: themes[theme].fontHint }]} numberOfLines={1} testID={testID}>
				{name}
			</Text>
		</View>
	);
});

export default Tag;
