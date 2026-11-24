import { StyleSheet } from 'react-native';

import { BAR_WIDTH } from './layoutBars';

export default StyleSheet.create({
	track: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		height: 28,
		minWidth: 0,
		overflow: 'hidden'
	},
	bar: {
		width: BAR_WIDTH,
		flexShrink: 0,
		borderRadius: BAR_WIDTH / 2
	}
});
