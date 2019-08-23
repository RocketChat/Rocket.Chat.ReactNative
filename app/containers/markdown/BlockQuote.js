import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import styles from './styles';

const BlockQuote = React.memo(({ children }) => (
	<View style={styles.container}>
		<View style={styles.quote} />
		<View style={styles.childContainer}>
			{children}
		</View>
	</View>
));

BlockQuote.propTypes = {
	children: PropTypes.node.isRequired
};

export default BlockQuote;
