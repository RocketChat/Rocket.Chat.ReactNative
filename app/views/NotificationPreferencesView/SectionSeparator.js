import React from 'react';
import {
	View
} from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';

const SectionSeparator = React.memo(({ theme }) => (
	<View
		style={[
			styles.sectionSeparatorBorder,
			{ backgroundColor: themes[theme].auxiliaryBackground }
		]}
	/>
));

SectionSeparator.propTypes = {
	theme: PropTypes.string
};

export default SectionSeparator;
