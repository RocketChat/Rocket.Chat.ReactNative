import { StyleSheet } from 'react-native';

import { colors } from '../../lib/constants';

export const styles = StyleSheet.create({
	mainContainer: {
		backgroundColor: colors.light.backgroundColor,
		flex: 1,
		padding: 20
	},
	title: {
		fontSize: 24,
		lineHeight: 29,
		fontWeight: '600'
	},
	tileContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		flexWrap: 'wrap'
	},
	profileImageContainer: {
		marginRight: 20
	},
	profileImage: {
		// width: 24,
		// height: 24,
		borderRadius: 12,
		// backgroundColor: 'red'
	}
});

export const createTileStyles = ({ size, color }: { size?: 'small' | 'large'; color: string }) =>
	StyleSheet.create({
		tile: {
			width: size === 'small' ? 96 : 130,
			marginVertical: 16,
			alignItems: 'center'
		},
		tileContent: {
			alignItems: 'center'
		},
		imageContainer: {
			justifyContent: 'center',
			alignItems: 'center',
			width: size === 'small' ? 80 : 130,
			height: size === 'small' ? 80 : 130,
			borderRadius: size === 'small' ? 10 : 65,
			backgroundColor: color
		},
		text: {
			fontSize: 16,
			lineHeight: 19,
			textAlign: 'center',
			fontWeight: '500',
			marginTop: size === 'small' ? 14 : 16
		},
		smallImage: {
			width: 45,
			height: 45
		},
		largeImage: {
			width: 75,
			height: 75
		}
	});
