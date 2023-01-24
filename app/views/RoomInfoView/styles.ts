import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	scroll: {
		flex: 1,
		flexDirection: 'column'
	},
	item: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		justifyContent: 'center',
		marginLeft: 30
	},
	avatarContainer: {
		minHeight: 240,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20
	},
	avatarContainerDirectRoom: {
		paddingVertical: 16,
		minHeight: 320
	},
	avatar: {
		marginHorizontal: 10
	},
	roomTitleContainer: {
		paddingTop: 20,
		marginHorizontal: 16,
		alignItems: 'center'
	},
	roomTitle: {
		fontSize: 20,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textMedium
	},
	roomUsername: {
		fontSize: 18,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textRegular
	},
	roomTitleRow: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	status: {
		bottom: -4,
		right: -4
	},
	itemLabel: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textMedium
	},
	itemContent: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	itemContent__empty: {
		fontStyle: 'italic'
	},
	rolesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	roleBadge: {
		padding: 6,
		borderRadius: 4,
		marginRight: 6,
		marginBottom: 6
	},
	role: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	roomButtonsContainer: {
		flexDirection: 'row',
		paddingTop: 30
	},
	roomButton: {
		alignItems: 'center',
		paddingHorizontal: 20,
		justifyContent: 'space-between'
	},
	roomButtonText: {
		marginTop: 5
	},
	roomBadge: {
		width: '50%',
		marginTop: 10,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		backgroundColor: 'white'
	},
	locationView: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 10
	},
	deviceContainer: {
		flexDirection: 'row',
		top: 30,
		marginBottom: 30,
		width: '100%'
	},
	t1dView: {
		marginLeft: '50%',
		marginRight: '20%'
	},
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 22
	},
	modalView: {
		margin: 20,
		backgroundColor: 'white',
		borderRadius: 20,
		padding: 35,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5
	},
	button: {
		borderRadius: 20,
		padding: 10,
		elevation: 2,
		flexDirection: 'row',
		width: '50%',
		shadowOpacity: 0.25,
		shadowRadius: 4
	},
	buttonOpen: {
		backgroundColor: '#F194FF'
	},
	buttonClose: {
		backgroundColor: '#2ed322'
	},
	textStyle: {
		color: 'white',
		fontWeight: 'bold',
		textAlign: 'center'
	},
	modalText: {
		marginBottom: 15,
		textAlign: 'center',
		...sharedStyles.textAlignCenter,
		...sharedStyles.textRegular
	}
});
