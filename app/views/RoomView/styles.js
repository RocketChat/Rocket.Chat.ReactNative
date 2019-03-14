import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	typing: { fontWeight: 'bold', paddingHorizontal: 15, height: 25 },
	container: {
		flex: 1,
		backgroundColor: '#fff'
	},
	safeAreaView: {
		flex: 1
	},
	list: {
		flex: 1,
		transform: [{ scaleY: -1 }]
	},
	separator: {
		height: 1,
		backgroundColor: '#CED0CE'
	},
	bannerContainer: {
		backgroundColor: 'orange'
	},
	bannerText: {
		margin: 5,
		textAlign: 'center',
		color: '#a00'
	},
	loadingMore: {
		transform: [{ scaleY: -1 }],
		textAlign: 'center',
		padding: 15,
		color: '#ccc'
	},
	readOnly: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginVertical: 15
	},
	reactionPickerContainer: {
		// width: width - 20,
		// height: width - 20,
		backgroundColor: '#F7F7F7',
		borderRadius: 4,
		flexDirection: 'column'
	},
	loading: {
		flex: 1
	},
	imageBackground: {
		width: '100%',
		height: '100%',
		position: 'absolute'
	},
	joinRoomContainer: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginVertical: 15
	},
	joinRoomButton: {
		width: 107,
		height: 44,
		marginTop: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#1d74f5',
		borderRadius: 4
	},
	joinRoomText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '500'
	},
	previewMode: {
		fontSize: 16,
		fontWeight: '500',
		color: '#0C0D0F'
	}
});
