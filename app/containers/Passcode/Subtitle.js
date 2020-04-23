import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';

const Subtitle = ({ theme }) => (
	<Text
		style={[
			styles.textSubtitle,
			{
				color: themes[theme].bodyText
			}
		]}
	>
		Subtitle
	</Text>
);

Subtitle.propTypes = {
	theme: PropTypes.string
};

export default Subtitle;
