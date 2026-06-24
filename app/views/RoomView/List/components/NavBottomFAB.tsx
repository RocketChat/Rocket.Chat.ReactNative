import { memo, type ReactElement } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CustomIcon } from '../../../../containers/CustomIcon';
import Touch from '../../../../containers/Touch';
import { EDGE_DISTANCE } from '../constants';
import i18n from '../../../../i18n';

const styles = StyleSheet.create(theme => ({
	container: {
		position: 'absolute',
		right: EDGE_DISTANCE,
		bottom: EDGE_DISTANCE
	},
	button: {
		borderRadius: 25,
		backgroundColor: theme.colors.surfaceRoom
	},
	content: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderColor: theme.colors.strokeLight
	}
}));

const NavBottomFAB = memo(({ visible, onPress }: { visible: boolean; onPress: Function }): ReactElement | null => {
	if (!visible) {
		return null;
	}

	return (
		<View style={styles.container}>
			<Touch
				accessible
				accessibilityLabel={i18n.t('Jump_to_last_message')}
				onPress={() => onPress()}
				style={styles.button}
				testID='nav-jump-to-bottom'>
				<View style={styles.content}>
					<CustomIcon name='chevron-down' size={36} />
				</View>
			</Touch>
		</View>
	);
});

export default NavBottomFAB;
