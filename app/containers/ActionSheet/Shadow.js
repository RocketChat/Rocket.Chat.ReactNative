import React from 'react';
import PropTypes from 'prop-types';
import Animated from 'react-native-reanimated';

import { themes } from '../../constants/colors';
import styles from './styles';

const Shadow = React.memo(({ fall, theme }) => {
	const opacity = Animated.interpolate(fall, {
		inputRange: [0, 1],
		outputRange: [0.5, 0]
	});

	return (
		<Animated.View
			pointerEvents='none'
			style={[
				styles.shadow,
				{
					backgroundColor: themes[theme].backdropColor,
					opacity
				}
			]}
		/>
	);
});
Shadow.propTypes = {
	fall: PropTypes.number,
	theme: PropTypes.string
};
export default Shadow;
