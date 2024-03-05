import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	mainContainer: {
		flex: 1,
		paddingBottom: 20
	},
	profileContainer: {
		marginTop: 20,
		alignSelf: 'center'
	},
	profileImage: {},

	nameContainer: {
		flexDirection: 'row',
		alignSelf: 'center',
		marginTop: 40,
		alignItems: 'center'
	},
	playIconContainer: {
		position: 'absolute',
		right: -10,
		bottom: -10
	},
	playIcon: {
		height: 50,
		width: 50
	},
	profileName: {
		marginLeft: 10,
		fontSize: 18
	},
	locationContainer: {
		marginTop: 20,
		alignSelf: 'center'
	},
	locationText: {
		marginLeft: 10,
		fontSize: 18
	},
	userInfoContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '70%',
		alignSelf: 'center',
		marginTop: 20
	},
	userInfoTextContainer: {
		alignItems: 'center'
	},
	userInfoTextContainerLeft: {
		width: '50%'
	},
	userInfoTextContainerRight: {
		width: '50%',
		marginLeft: 10
	},
	userInfoText: {
		fontSize: 18,
		alignSelf: 'center'
	},
	userInfoTextGrey: {
		fontSize: 16,
		alignSelf: 'center',
		color: '#424146',
		flexWrap:'wrap',
		textAlign:'center'
	},
	connectButton: {
		backgroundColor: '#799A79',
		padding: 15,
		width: '85%',
		alignSelf: 'center',
		borderRadius: 40,
		marginVertical: 20,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 10
		},
		shadowOpacity: 0.2,
		shadowRadius: 15,
		elevation: 5
	},
	connectButtonText: {
		fontWeight: '600',
		fontSize: 16,
		color: '#fff',
		textAlign: 'center'
	},
	bioContainer: {
		marginHorizontal: '10%',
		marginTop: 10
	},
	aboutTextHeader: {
		fontSize: 26,
		fontWeight: '400',
		marginLeft: 10,
		marginBottom: 10
	},
	aboutText: {
		fontSize: 16,
		fontWeight: '400',
		marginLeft: 10,
		marginBottom: 10
	}
});

export default styles;
