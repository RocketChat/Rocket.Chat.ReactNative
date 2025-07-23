import { Dimensions, StyleSheet, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;
export const SCANNER_SIZE = 280;

export const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	camera: {
		flex: 1
	},
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0
	},
	topOverlay: {
		height: (screenHeight - SCANNER_SIZE) / 2
	},
	bottomOverlay: {
		flex: 1
	},
	middleSection: {
		flexDirection: 'row',
		height: SCANNER_SIZE
	},
	sideOverlay: {
		width: (screenWidth - SCANNER_SIZE) / 2
	},
	scannerArea: {
		width: SCANNER_SIZE,
		height: SCANNER_SIZE,
		backgroundColor: 'transparent'
	},
	header: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		paddingTop: Platform.OS === 'ios' ? 60 : 40,
		paddingHorizontal: 20,
		paddingBottom: 20,
		zIndex: 10,
		backgroundColor: 'rgba(0, 0, 0, 0.3)'
	},
	closeButton: {
		position: 'absolute',
		top: Platform.OS === 'ios' ? 60 : 40,
		left: 20,
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 11,
		borderWidth: 1
	},
	instructionContainer: {
		alignItems: 'center',
		marginTop: 60,
		paddingHorizontal: 20
	},
	instructionText: {
		fontSize: 28,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 8,
		letterSpacing: -0.5
	},
	subInstructionText: {
		fontSize: 16,
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 4
	},
	scannerFrame: {
		position: 'absolute',
		top: (screenHeight - SCANNER_SIZE) / 2,
		left: (screenWidth - SCANNER_SIZE) / 2,
		width: SCANNER_SIZE,
		height: SCANNER_SIZE
	},
	corner: {
		position: 'absolute',
		width: CORNER_SIZE,
		height: CORNER_SIZE
	},
	topLeft: {
		top: -2,
		left: -2
	},
	topRight: {
		top: -2,
		right: -2,
		transform: [{ rotate: '90deg' }]
	},
	bottomLeft: {
		bottom: -2,
		left: -2,
		transform: [{ rotate: '270deg' }]
	},
	bottomRight: {
		bottom: -2,
		right: -2,
		transform: [{ rotate: '180deg' }]
	},
	cornerHorizontal: {
		position: 'absolute',
		height: CORNER_THICKNESS,
		width: CORNER_SIZE,
		borderRadius: 2,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.6,
		shadowRadius: 4,
		elevation: 4
	},
	cornerVertical: {
		position: 'absolute',
		width: CORNER_THICKNESS,
		height: CORNER_SIZE,
		borderRadius: 2,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.6,
		shadowRadius: 4,
		elevation: 4
	},
	scanLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 3,
		borderRadius: 1.5,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.8,
		shadowRadius: 6,
		elevation: 4
	},
	footer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		paddingBottom: Platform.OS === 'ios' ? 50 : 30,
		paddingHorizontal: 20,
		paddingTop: 20,
		zIndex: 10,
		backgroundColor: 'rgba(0, 0, 0, 0.3)'
	},
	footerControls: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	controlButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1
	},
	permissionContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40
	},
	permissionTitle: {
		fontSize: 24,
		fontWeight: '700',
		textAlign: 'center',
		marginTop: 24,
		marginBottom: 16
	},
	permissionText: {
		fontSize: 16,
		textAlign: 'center',
		lineHeight: 24,
		marginBottom: 32
	},
	permissionButton: {
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 8,
		marginBottom: 16,
		minWidth: 200
	},
	permissionButtonText: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center'
	},
	closeButtonText: {
		fontSize: 16,
		fontWeight: '500',
		textAlign: 'center'
	},
	loadingText: {
		fontSize: 16,
		marginTop: 16,
		fontWeight: '500'
	}
});