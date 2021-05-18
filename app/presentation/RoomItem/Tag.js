import React from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import { useTheme } from '../../theme';
import styles from './styles';

const Tag = React.memo(({ name }) => {
	const { theme } = useTheme();

	return (
		<View style={[styles.tagContainer, { backgroundColor: themes[theme].borderColor }]}>
			<Text
				style={[
					styles.tagText, { color: themes[theme].infoText }
				]}
				numberOfLines={1}
			>
				{name}
			</Text>
		</View>
	);
});

Tag.propTypes = {
	name: PropTypes.string
};

export default Tag;
