/* eslint-disable react/no-array-index-key */
import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';
import styles from '../styles';
import Paragraph from './Paragraph';

const Quote = ({ value }) => {
	const { theme } = useTheme();
	return (
		<>
			<View style={styles.container}>
				<View style={[styles.quote, { backgroundColor: themes[theme].borderColor }]} />
				<View style={styles.childContainer}>
					{value.map((item, index) => (
						<Paragraph key={index} value={item.value} mentions={[]} />
					))}
				</View>
			</View>
		</>
	);
};

Quote.propTypes = {
	value: PropTypes.string
};

export default Quote;
