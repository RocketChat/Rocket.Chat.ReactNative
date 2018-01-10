import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const EMOJI_SIZE = (width - 10) / 8;

export default StyleSheet.create({
	container: {
		flex: 1
	},
	tabsContainer: {
		height: 45,
		flexDirection: 'row',
		paddingTop: 5
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingBottom: 10
	},
	tabEmoji: {
		fontSize: 20,
		color: 'black'
	},
	activeTabLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 2,
		backgroundColor: '#007aff',
		bottom: 0
	},
	tabLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 2,
		backgroundColor: 'rgba(0,0,0,0.05)',
		bottom: 0
	},
	categoryInner: {
		flexWrap: 'wrap',
		flexDirection: 'row'
	},
	categoryEmoji: {
		fontSize: EMOJI_SIZE - 14,
		color: 'black',
		height: EMOJI_SIZE,
		width: EMOJI_SIZE,
		// width: width / 8,
		textAlign: 'center'
	}
});
