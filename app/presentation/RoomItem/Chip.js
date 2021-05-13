import React from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';

const Chip = React.memo(({ name, theme }) => (
	<View style={{ backgroundColor: themes[theme].auxiliaryText, padding: 8 }}>
		<Text
			style={[
				styles.title,
				{ color: themes[theme].bodyText }
			]}
			numberOfLines={1}
		>
			{name}
		</Text>
	</View>
));

Chip.propTypes = {
	name: PropTypes.string,
	theme: PropTypes.string
};

export default Chip;
