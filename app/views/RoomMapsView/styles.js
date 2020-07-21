import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	// index.js
	container: {
		flex: 1
	},
	headerContainer: {
		height: 44,
		width: '100%',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row'
	},
	buttonclosed: {
		height: 44,
		width: 44,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 10
	},
	textHeader: {
		fontSize: 16
	},
	maps: {
		flex: 1,
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0
	},
	buttonFocus: {
		position: 'absolute',
		right: 25,
		top: 25,
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: '#fff',
		justifyContent: 'center',
		alignItems: 'center'
	},
	markerLocation: {
		left: '45%',
		position: 'absolute',
		top: '44%'
	},
	// bottom sheet
	content: {
		backgroundColor: '#fff',
		height: '100%'
	},
	separator: {
		marginLeft: 60
	},
	buttonAddress: {
		width: '100%',
		height: 60,
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 10
	},
	iconAddress: {
		width: 20,
		height: 20
	},
	imageIconView: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff'
	},
	addressView: {
		marginLeft: 10,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	currentLocation: {
		height: 120,
		width: '100%'
	},
	geolocation: {
		borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	text: {
		fontSize: 14,
		width: '80%'
	},
	headerSheet: {
		width: '100%',
		height: 20,
		justifyContent: 'center',
		alignItems: 'center'
	},
	sheetTouchHeader: {
		width: 50,
		height: 10,
		borderRadius: 10
	},
	placeNearByView: {
		height: 30,
		width: '100%',
		borderTopWidth: 0.5
	},
	textPlaceNearByYou: {
		fontSize: 14,
		fontWeight: '700',
		marginLeft: 15,
		marginTop: 5
	},
	footerModal: {
		height: 40,
		justifyContent: 'space-between',
		width: '100%',
		borderTopWidth: 0.5
	},
	currentLocationLeft: {
		height: 50,
		width: 50,
		justifyContent: 'center',
		alignItems: 'center'
	},
	currentLocationContent: {
		height: 50,
		width: '100%',
		justifyContent: 'center'
	},
	textShareRoom: {
		fontSize: 14,
		width: '90%',
		marginTop: 20
	},
	buttonRefreshAddress: {
		width: 100,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 20,
		backgroundColor: '#db1d39',
		marginTop: 10
	},
	alertNotFoundAddress: {
		fontSize: 14,
		fontWeight: '400'
	},
	refreshView: {
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'column',
		width: '100%'
	},
	txtRefresh: {
		fontSize: 14,
		fontWeight: '600',
		color: '#fff'
	},
	headerButton: {
		height: 44,
		width: 44,
		justifyContent: 'center',
		alignItems: 'center'
	}
});
