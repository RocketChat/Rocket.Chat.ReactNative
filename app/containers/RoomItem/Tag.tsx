import React from 'react';
import { Text, View } from 'react-native';

import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import styles from './styles';

interface ITag {
	name: string;
	testID?: string;
}

const Tag = React.memo(({ name, testID }: ITag) => {
	const { theme } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();

	return (
		<View style={[styles.tagContainer, { backgroundColor: themes[theme].strokeLight }]}>
			<Text style={[styles.tagText, { color: themes[theme].fontHint, fontSize: scaleFontSize(13) }]} numberOfLines={1} testID={testID}>
				{name}
			</Text>
		</View>
	);
});

export default Tag;
