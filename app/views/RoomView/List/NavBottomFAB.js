import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Animated, {
	call, cond, greaterOrEq, useCode
} from 'react-native-reanimated';

import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import { useTheme } from '../../../theme';
import Touch from '../../../utils/touch';

const SCROLL_LIMIT = 200;

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 15,
		bottom: 100
	},
	button: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const NavBottomFAB = ({ y, onPress }) => {
	const { theme } = useTheme();
	const [show, setShow] = useState(false);
	const handleOnPress = useCallback(() => onPress());

	const toggle = (v) => {
		setShow(v);
	};

	useCode(() => cond(greaterOrEq(y, SCROLL_LIMIT),
		call([y], () => toggle(true)),
		call([y], () => toggle(false))),
	[y]);

	if (!show) {
		return null;
	}

	return (
		<Animated.View
			style={styles.container}
		>
			<Touch
				onPress={handleOnPress}
				style={[styles.button, { backgroundColor: themes[theme].backgroundColor, borderColor: themes[theme].borderColor }]}
				theme={theme}
			>
				<CustomIcon name='chevron-down' color={themes[theme].auxiliaryTintColor} size={36} />
			</Touch>
		</Animated.View>
	);
};

NavBottomFAB.propTypes = {
	y: Animated.Value,
	onPress: PropTypes.func
};

export default NavBottomFAB;
