import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { themes } from '../../../constants/colors';
import styles from '../styles';
import { useTheme } from '../../../theme';

const Heading = ({ value, level }) => {
	const { theme } = useTheme();
	const textStyle = styles[`heading${ level }`];

	return (
		<>
			{value.map((block) => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return (
							<Text style={[textStyle, { color: themes[theme].bodyText }]}>
								{block.value}
							</Text>
						);
					default:
						return null;
				}
			})}
		</>
	);
};

Heading.propTypes = {
	value: PropTypes.string,
	level: PropTypes.number
};

export default Heading;
