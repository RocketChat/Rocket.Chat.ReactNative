import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import { themes } from '../../constants/colors';

import styles from './styles';

const BlockQuote = React.memo(({ children, theme }) => (
	<View style={styles.container}>
		<View style={[styles.quote, { backgroundColor: themes[theme].borderColor }]} />
		<View style={styles.childContainer}>
			{children}
		</View>
	</View>
));

BlockQuote.propTypes = {
	children: PropTypes.node.isRequired,
	theme: PropTypes.string
};

export default BlockQuote;
