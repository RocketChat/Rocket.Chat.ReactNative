import { StyleSheet } from 'react-native';

const UNIT = 16;

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
		height: UNIT * 5.5
	},
	colButtonCircle: {
		flex: 0,
		marginLeft: UNIT / 2,
		marginRight: UNIT / 2,
		alignItems: 'center',
		width: UNIT * 4,
		height: UNIT * 4
	},
	text: {
		fontSize: UNIT * 2,
		fontWeight: '200'
	},
	deleteText: {
		fontSize: UNIT * 1.2,
		fontWeight: '200'
	},
	buttonCircle: {
		alignItems: 'center',
		justifyContent: 'center',
		width: UNIT * 4,
		height: UNIT * 4,
		borderRadius: UNIT * 2,
		borderWidth: 1
	},
	textTitle: {
		fontSize: 20,
		fontWeight: '200',
		lineHeight: UNIT * 2.5
	},
	textSubtitle: {
		fontSize: UNIT,
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
