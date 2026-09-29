import { memo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-plain-text';
import { Row } from 'react-native-easy-grid';

import styles from './styles';
import { useTheme } from '~/theme';

interface IPasscodeTitle {
	text: string;
}

const Title = memo(({ text }: IPasscodeTitle) => {
	const { colors } = useTheme();

	return (
		<Row style={styles.row}>
			<View style={styles.titleView}>
				<Text style={[styles.textTitle, { color: colors.fontTitlesLabels }]}>{text}</Text>
			</View>
		</Row>
	);
});

export default Title;
