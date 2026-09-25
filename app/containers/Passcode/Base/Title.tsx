import { memo } from 'react';
import { View } from 'react-native';
import { PlainText } from '~/containers/PlainText';
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
				<PlainText style={[styles.textTitle, { color: colors.fontTitlesLabels }]}>{text}</PlainText>
			</View>
		</Row>
	);
});

export default Title;
