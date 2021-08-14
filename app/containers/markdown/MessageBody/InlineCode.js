import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '@react-navigation/native';

import styles from '../styles';
import { themes } from '../../../constants/colors';

const InlineCode = ({ value, style }) => {
	const { theme } = useTheme();

	return (
		<Text style={[
			{
				...styles.codeInline,
				color: themes[theme].bodyText,
				backgroundColor: themes[theme].bannerBackground,
				borderColor: themes[theme].bannerBackground
			},
			...style
		]}
		>
			{((block) => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return block.value;
					default:
						return null;
				}
			})(value)}
		</Text>
	);
};

InlineCode.propTypes = {
	value: PropTypes.object,
	style: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default InlineCode;
