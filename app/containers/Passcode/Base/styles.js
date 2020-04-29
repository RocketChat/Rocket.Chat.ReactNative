import { StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';

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
		// flex: 2
	},
	viewSubtitle: {
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'center',
		height: 30
		// flex: 2
	},
	row: {
		flex: 0,
		flexShrink: 1,
		alignItems: 'center',
		// height: UNIT * 5.5
		height: 102
	},
	colButtonCircle: {
		flex: 0,
		marginLeft: 12,
		marginRight: 12,
		// marginTop: 12,
		// marginBottom: 12,
		alignItems: 'center',
		width: 78,
		height: 78
	},
	text: {
		fontSize: 28,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	deleteText: {
		fontSize: UNIT * 1.2,
		fontWeight: '200'
	},
	buttonCircle: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 78,
		height: 78,
		borderRadius: 4
		// width: UNIT * 4,
		// height: UNIT * 4,
		// borderRadius: UNIT * 2,
		// borderWidth: 1
	},
	textTitle: {
		fontSize: 22,
		...sharedStyles.textRegular,
		fontWeight: '300',
		// lineHeight: UNIT * 2.5
	},
	textSubtitle: {
		fontSize: 16,
		...sharedStyles.textRegular,
		// fontWeight: '300',
		textAlign: 'center'
	},
	flexCirclePasscode: {
		// flex: 2,
		marginTop: 24,
		marginBottom: 40,
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
		alignItems: 'center',
		height: 16
	},
	grid: {
		justifyContent: 'flex-start',
		width: '100%',
		// flex: 7
	}
});
