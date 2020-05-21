import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';

const Header = ({ title, theme }) => (
	<Text style={[styles.header, { color: themes[theme].titleText }]}>{title}</Text>
);
Header.propTypes = {
	title: PropTypes.string,
	theme: PropTypes.string
};

export default Header;
