import { StyleSheet } from 'react-native';

export const WIDTH = 100;

export default StyleSheet.create({
	actionsContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: '100%'
	},
	actionsRightContainer: {
		flexDirection: 'row',
		position: 'absolute',
		left: 0,
		right: 0,
		height: '100%'
	},
	actionRightButtonContainer: {
		position: 'absolute',
		justifyContent: 'center',
		top: 0,
		height: '100%'
	},
	actionButton: {
		width: WIDTH,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	}
});
