import { type ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FLOATING_ACTION_BUTTON_MARGIN } from './constants';

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFill,
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
		padding: FLOATING_ACTION_BUTTON_MARGIN
	}
});

const FloatingActionButtonContainer = ({ children }: { children: ReactElement }) => (
	<SafeAreaView edges={['bottom']} pointerEvents='box-none' style={styles.container}>
		{children}
	</SafeAreaView>
);

export default FloatingActionButtonContainer;
