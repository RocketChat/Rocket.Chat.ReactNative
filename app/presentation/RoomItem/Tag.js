import React from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import { useTheme } from '../../theme';
import sharedStyles from '../../views/Styles';

const Tag = React.memo(({ name }) => {
	const { theme } = useTheme();

	return (
		<View style={{ backgroundColor: themes[theme].borderColor, alignItems: 'center', borderRadius: 4 }}>
			<Text
				style={[
					{
						fontSize: 13,
						color: themes[theme].infoText,
						paddingHorizontal: 4,
						...sharedStyles.textSemibold
					}
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
