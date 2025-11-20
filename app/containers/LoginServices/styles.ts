import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../views/Styles';

export const SERVICE_HEIGHT = 58;
export const BORDER_RADIUS = 4;
export const SERVICES_COLLAPSED_HEIGHT = 174;

export default StyleSheet.create({
	serviceButton: {
		borderRadius: BORDER_RADIUS,
		marginBottom: 10
	},
	serviceButtonContainer: {
		borderRadius: BORDER_RADIUS,
		width: '100%',
		paddingVertical: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	serviceIcon: {
		position: 'absolute',
		left: 15
	},
	serviceText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	serviceName: {
		...sharedStyles.textSemibold
	},
	options: {
		marginBottom: 0
	}
});
