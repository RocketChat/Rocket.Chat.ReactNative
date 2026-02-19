import { Text, View } from 'react-native';
import { Row } from 'react-native-easy-grid';
import { memo } from 'react';

import styles from './styles';
import { useTheme } from '../../../theme';

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
