import { StyleSheet } from 'react-native';

import * as List from '../List';

const styles = StyleSheet.create({
	separator: {
		width: '100%',
		alignSelf: 'center',
		// Container spacing contributes 16; the extra 8 reproduces the web
		// divider rhythm of 24 (RN margins don't collapse like CSS).
		marginVertical: 8
	}
});

export const Divider = () => <List.Separator style={styles.separator} />;
