import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from '../styles';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';

const InlineCode = ({ value, style }) => {
	const { theme } = useTheme();
	console.log({ value: value.value });
	return (
		<Text style={[
			{
				...styles.codeInline,
				color: themes[theme].bodyText,
				backgroundColor: themes[theme].bannerBackground,
				borderColor: themes[theme].borderColor
			},
			...style
		]}
		>
			{value.type === 'PLAIN_TEXT' && value.value}
		</Text>
	);
};

InlineCode.propTypes = {
	value: PropTypes.object,
	style: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default InlineCode;
