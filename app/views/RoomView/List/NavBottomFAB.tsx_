import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { call, cond, greaterOrEq, useCode } from 'react-native-reanimated';

import { themes } from '../../../lib/constants';
import { CustomIcon } from '../../../containers/CustomIcon';
import { useTheme } from '../../../theme';
import Touch from '../../../containers/Touch';
import { hasNotch } from '../../../lib/methods/helpers';

const SCROLL_LIMIT = 200;
const SEND_TO_CHANNEL_HEIGHT = 40;

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 15
	},
	button: {
		borderRadius: 25
	},
	content: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const NavBottomFAB = ({
	y,
	onPress,
	isThread
}: {
	y: Animated.Value<number>;
	onPress: Function;
	isThread: boolean;
}): React.ReactElement | null => {
	const { theme } = useTheme();
	const [show, setShow] = useState(false);
	const handleOnPress = () => onPress();
	const toggle = (v: boolean) => setShow(v);

	useCode(
		() =>
			cond(
				greaterOrEq(y, SCROLL_LIMIT),
				call([y], () => toggle(true)),
				call([y], () => toggle(false))
			),
		[y]
	);

	if (!show) {
		return null;
	}

	let bottom = hasNotch ? 100 : 60;
	if (isThread) {
		bottom += SEND_TO_CHANNEL_HEIGHT;
	}
	return (
		<Animated.View style={[styles.container, { bottom }]} testID='nav-jump-to-bottom'>
			<Touch onPress={handleOnPress} style={[styles.button, { backgroundColor: themes[theme].backgroundColor }]}>
				<View style={[styles.content, { borderColor: themes[theme].borderColor }]}>
					<CustomIcon name='chevron-down' color={themes[theme].auxiliaryTintColor} size={36} />
				</View>
			</Touch>
		</Animated.View>
	);
};

export default NavBottomFAB;
