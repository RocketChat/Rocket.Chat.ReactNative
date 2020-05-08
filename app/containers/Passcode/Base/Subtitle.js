import React from 'react';
import { View, Text } from 'react-native';
import { Row } from 'react-native-easy-grid';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../../constants/colors';

const Subtitle = React.memo(({ text, theme }) => (
	<Row style={styles.row}>
		<View style={styles.subtitleView}>
			<Text style={[styles.textSubtitle, { color: themes[theme].passcodeSecondary }]}>{text}</Text>
		</View>
	</Row>
));

Subtitle.propTypes = {
	text: PropTypes.string,
	theme: PropTypes.string
};

export default Subtitle;
