import React from 'react';
import { Text, View } from 'react-native';

import { themes } from '../../constants/colors';
import { useTheme } from '../../theme';
import styles from './styles';

interface ITag {
	name: string;
	testID?: string;
}

const Tag = React.memo(({ name, testID }: ITag) => {
	const { theme }: any = useTheme();

	return (
		<View style={[styles.tagContainer, { backgroundColor: themes[theme].borderColor }]}>
			<Text style={[styles.tagText, { color: themes[theme].infoText }]} numberOfLines={1} testID={testID}>
				{name}
			</Text>
		</View>
	);
});

export default Tag;
