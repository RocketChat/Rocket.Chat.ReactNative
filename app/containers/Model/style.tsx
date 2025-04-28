import { Dimensions, Platform, StyleSheet } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	overlay: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	modalContainer: {
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 20,
		minWidth: '80%',
		maxHeight: SCREEN_HEIGHT * 0.8,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 4
			},
			android: {
				elevation: 5
			}
		})
	}
});
export default styles;
