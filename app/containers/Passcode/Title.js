import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';

const Title = ({ theme }) => (
	<Text
		style={[
			styles.textTitle,
			{
				color: themes[theme].titleText,
			}
		]}
	>
		Title
	</Text>
);

Title.propTypes = {
	theme: PropTypes.string
};

export default Title;
