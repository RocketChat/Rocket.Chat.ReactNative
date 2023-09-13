import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';

import { themes } from '../../../lib/constants';
import { CustomIcon } from '../../../containers/CustomIcon';
import { useTheme } from '../../../theme';
import Touch from '../../../containers/Touch';

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
	visible,
	onPress,
	isThread
}: {
	visible: boolean;
	onPress: Function;
	isThread: boolean;
}): React.ReactElement | null => {
	const { theme } = useTheme();
	const handleOnPress = () => onPress();

	if (!visible) {
		return null;
	}

	return (
		<View
			style={[
				styles.container,
				{
					...Platform.select({
						ios: {
							bottom: 100 + (isThread ? 40 : 0)
						},
						android: {
							top: 15,
							scaleY: -1
						}
					})
				}
			]}
			testID='nav-jump-to-bottom'
		>
			<Touch onPress={handleOnPress} style={[styles.button, { backgroundColor: themes[theme].backgroundColor }]}>
				<View style={[styles.content, { borderColor: themes[theme].borderColor }]}>
					<CustomIcon name='chevron-down' color={themes[theme].auxiliaryTintColor} size={36} />
				</View>
			</Touch>
		</View>
	);
};

export default NavBottomFAB;
