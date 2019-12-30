import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Separator from '../Separator';

const styles = StyleSheet.create({
	separator: {
		width: '100%',
		alignSelf: 'center',
		marginVertical: 8
	}
});

export const Divider = ({ theme = 'light' }) => <Separator style={styles.separator} theme={theme} />;
Divider.propTypes = {
	theme: PropTypes.string
};
