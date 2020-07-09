import React from 'react';
import { View, Text } from 'react-native';
import { Row } from 'react-native-easy-grid';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../../constants/colors';

const Title = React.memo(({ text, theme }) => (
	<Row style={styles.row}>
		<View style={styles.titleView}>
			<Text style={[styles.textTitle, { color: themes[theme].passcodePrimary }]}>{text}</Text>
		</View>
	</Row>
));

Title.propTypes = {
	text: PropTypes.string,
	theme: PropTypes.string
};

export default Title;
