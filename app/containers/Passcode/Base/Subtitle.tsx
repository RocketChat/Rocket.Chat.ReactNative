import React from 'react';
import { Text, View } from 'react-native';
import { Row } from 'react-native-easy-grid';

import styles from './styles';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';

interface IPasscodeSubtitle {
	text: string;
}

const Subtitle = React.memo(({ text }: IPasscodeSubtitle) => {
	const { theme } = useTheme();

	return (
		<Row style={styles.row}>
			<View style={styles.subtitleView}>
				<Text style={[styles.textSubtitle, { color: themes[theme].passcodeSecondary }]}>{text}</Text>
			</View>
		</Row>
	);
});

export default Subtitle;
