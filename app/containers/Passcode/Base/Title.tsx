import React from 'react';
import { Text, View } from 'react-native';
import { Row } from 'react-native-easy-grid';

import styles from './styles';
import { themes } from '../../../constants/colors';

interface IPasscodeTitle {
	text: string;
	theme: string;
}

const Title = React.memo(({ text, theme }: IPasscodeTitle) => (
	<Row style={styles.row}>
		<View style={styles.titleView}>
			<Text style={[styles.textTitle, { color: themes[theme].passcodePrimary }]}>{text}</Text>
		</View>
	</Row>
));

export default Title;
