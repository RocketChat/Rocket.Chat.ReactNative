import { memo } from 'react';
import { View } from 'react-native';
import { PlainText } from '~/containers/PlainText';

import { themes } from '~/lib/constants/colors';
import { useTheme } from '~/theme';
import styles from './styles';

interface ITag {
	name: string;
	testID?: string;
}

const Tag = memo(({ name, testID }: ITag) => {
	const { theme } = useTheme();

	return (
		<View style={[styles.tagContainer, { backgroundColor: themes[theme].strokeLight }]}>
			<PlainText style={[styles.tagText, { color: themes[theme].fontHint }]} numberOfLines={1} testID={testID}>
				{name}
			</PlainText>
		</View>
	);
});

export default Tag;
