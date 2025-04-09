import { I18nManager, StyleSheet } from 'react-native';

import { ACTION_WIDTH } from './constants';

export const styles = StyleSheet.create({
	leftAction: {
		flex: 1,
		backgroundColor: '#497AFC',
		justifyContent: 'center'
	},
	leftActionView: {
		width: ACTION_WIDTH
	},
	leftActionsView: {
		width: ACTION_WIDTH,
		flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row'
	},
	rightActionView: {
		flex: 1
	},
	rightActionsView: {
		width: ACTION_WIDTH * 2,
		flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row'
	},
	rightAction: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center'
	}
});
