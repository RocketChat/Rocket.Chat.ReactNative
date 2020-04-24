import { StyleSheet } from 'react-native';

import grid from './grid';

export default StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	viewTitle: {
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'center',
		flex: 2
	},
	row: {
		flex: 0,
		flexShrink: 1,
		alignItems: 'center',
		height: grid.unit * 5.5
	},
	colButtonCircle: {
		flex: 0,
		marginLeft: grid.unit / 2,
		marginRight: grid.unit / 2,
		alignItems: 'center',
		width: grid.unit * 4,
		height: grid.unit * 4
	},
	text: {
		fontSize: grid.unit * 2,
		fontWeight: '200'
	},
	deleteText: {
		fontSize: grid.unit * 1.2,
		fontWeight: '200'
	},
	buttonCircle: {
		alignItems: 'center',
		justifyContent: 'center',
		width: grid.unit * 4,
		height: grid.unit * 4,
		borderRadius: grid.unit * 2,
		borderWidth: 1
	},
	textTitle: {
		fontSize: 20,
		fontWeight: '200',
		lineHeight: grid.unit * 2.5
	},
	textSubtitle: {
		fontSize: grid.unit,
		fontWeight: '200',
		textAlign: 'center'
	},
	flexCirclePasscode: {
		flex: 2,
		justifyContent: 'center',
		alignItems: 'center'
	},
	topViewCirclePasscode: {
		flexDirection: 'row',
		height: 'auto',
		justifyContent: 'center',
		alignItems: 'center'
	},
	viewCircles: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	grid: {
		justifyContent: 'flex-start',
		width: '100%',
		flex: 7
	}
});
