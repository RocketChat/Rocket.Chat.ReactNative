import { StyleSheet } from 'react-native';

import { isIOS } from '../../utils/deviceInfo';

export default StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	centerContainer: {
		flex: 1,
		height: '100%',
		marginRight: 4
	},
	title: {
		flex: 1,
		fontSize: 18,
		color: '#0C0D0F',
		fontWeight: '400',
		marginRight: 5,
		paddingTop: 0,
		paddingBottom: 0
	},
	alert: {
		fontWeight: '600'
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	titleContainer: {
		width: '100%',
		marginTop: isIOS ? 5 : 2,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	date: {
		fontSize: 14,
		color: '#9EA2A8',
		fontWeight: 'normal',
		paddingTop: 0,
		paddingBottom: 0
	},
	updateAlert: {
		color: '#1D74F5'
	},
	unreadNumberContainer: {
		minWidth: 23,
		padding: 3,
		borderRadius: 4,
		backgroundColor: '#1D74F5',
		alignItems: 'center',
		justifyContent: 'center'
	},
	unreadNumberText: {
		color: '#fff',
		overflow: 'hidden',
		fontSize: 14,
		fontWeight: '500',
		letterSpacing: 0.56
	},
	status: {
		borderRadius: 10,
		width: 10,
		height: 10,
		marginRight: 7,
		marginTop: 3
	},
	disclosureContainer: {
		height: '100%',
		marginLeft: 6,
		marginRight: 9,
		alignItems: 'center',
		justifyContent: 'center'
	},
	disclosureIndicator: {
		width: 20,
		height: 20
	},
	emptyDisclosureAndroid: {
		width: 15
	},
	markdownText: {
		flex: 1,
		color: '#9EA2A8',
		fontSize: 15,
		fontWeight: 'normal'
	}
});
