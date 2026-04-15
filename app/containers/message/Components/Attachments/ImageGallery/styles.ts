import { StyleSheet } from 'react-native';

export const GAP = 2;
export const GALLERY_HEIGHT = 200;
export const CELL_HEIGHT_HALF = (GALLERY_HEIGHT - GAP) / 2;

export default StyleSheet.create({
	galleryContainer: {
		flexDirection: 'row',
		overflow: 'hidden',
		borderRadius: 4
	},
	leftColumn: {
		flexDirection: 'column'
	},
	rightColumn: {
		flexDirection: 'column'
	},
	cell: {
		overflow: 'hidden',
		borderRadius: 4
	},
	overflayWrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center'
	},
	overflowText: {
		fontSize: 20,
		lineHeight: 28
	}
});
