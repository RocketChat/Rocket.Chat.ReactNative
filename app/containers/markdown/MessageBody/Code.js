/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import CodeLine from './CodeLine';
import styles from '../styles';

import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';

const Code = ({
	value, style
}) => {
	const { theme } = useTheme();

	return (
		<Text
			style={[
				{
					...styles.codeBlock,
					color: themes[theme].bodyText,
					backgroundColor: themes[theme].bannerBackground,
					borderColor: themes[theme].borderColor
				},
				...style
			]}
		>
			{value.map((block, index) => {
				switch (block.type) {
					case 'CODE_LINE':
						return <CodeLine key={index} value={block.value} />;
					default:
						return null;
				}
			})}
		</Text>
	);
};

Code.propTypes = {
	value: PropTypes.array,
	style: PropTypes.object
};

export default Code;
