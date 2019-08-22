import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import { CustomIcon } from '../../lib/Icons';

import styles from './styles';

const BlockQuote = React.memo(({
	continue: _continue, children
}) => {
	let icon;
	if (!_continue) {
		icon = (
			<CustomIcon
				name='quote'
				size={14}
			/>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.icon}>
				{icon}
			</View>
			<View style={styles.childContainer}>
				{children}
			</View>
		</View>
	);
});

BlockQuote.propTypes = {
	continue: PropTypes.bool,
	children: PropTypes.node.isRequired
};

export default BlockQuote;
