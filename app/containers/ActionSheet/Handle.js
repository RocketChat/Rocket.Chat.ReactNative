import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';

const Handle = React.memo(({ theme }) => (
	<View style={[styles.handle, { backgroundColor: themes[theme].focusedBackground }]} testID='scroll-bottom-sheet-handle'>
		<View style={[styles.handleIndicator, { backgroundColor: themes[theme].auxiliaryText }]} />
	</View>
));
Handle.propTypes = {
	theme: PropTypes.string
};

export default Handle;
