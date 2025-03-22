import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomIcon } from '../../../../containers/CustomIcon';
import { useTheme } from '../../../../theme';
import Touch from '../../../../containers/Touch';
import { useNavBottomStyle } from '../hooks';
import { EDGE_DISTANCE } from '../constants';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: EDGE_DISTANCE
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

const NavBottomFAB = memo(
	({ visible, onPress, isThread }: { visible: boolean; onPress: Function; isThread: boolean }): React.ReactElement | null => {
		const { colors } = useTheme();
		const positionStyle = useNavBottomStyle(isThread);

		if (!visible) {
			return null;
		}

		return (
			<View style={[styles.container, positionStyle]} testID='nav-jump-to-bottom'>
				<Touch onPress={() => onPress()} style={[styles.button, { backgroundColor: colors.surfaceRoom }]}>
					<View style={[styles.content, { borderColor: colors.strokeLight }]}>
						<CustomIcon name='chevron-down' size={36} />
					</View>
				</Touch>
			</View>
		);
	}
);

export default NavBottomFAB;
