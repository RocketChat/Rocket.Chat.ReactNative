import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomIcon } from '../../../../containers/CustomIcon';
import { useTheme } from '../../../../theme';
import Touch from '../../../../containers/Touch';
import { EDGE_DISTANCE } from '../constants';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: EDGE_DISTANCE,
		bottom: EDGE_DISTANCE
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

const NavBottomFAB = memo(({ visible, onPress }: { visible: boolean; onPress: Function }): React.ReactElement | null => {
	const { colors } = useTheme();

	if (!visible) {
		return null;
	}

	return (
		<View style={styles.container} testID='nav-jump-to-bottom'>
			<Touch onPress={() => onPress()} style={[styles.button, { backgroundColor: colors.surfaceRoom }]}>
				<View style={[styles.content, { borderColor: colors.strokeLight }]}>
					<CustomIcon name='chevron-down' size={36} />
				</View>
			</Touch>
		</View>
	);
});

export default NavBottomFAB;
