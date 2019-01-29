import { Platform } from 'react-native';

export const DARK_HEADER = {
	statusBar: {
		backgroundColor: '#2F343D',
		style: 'light'
	},
	topBar: {
		backButton: {
			showTitle: false,
			color: '#fff'
		},
		background: {
			color: '#2F343D'
		},
		title: {
			color: '#FFF'
		},
		leftButtonStyle: {
			color: '#FFF'
		},
		rightButtonStyle: {
			color: '#FFF'
		}
	}
};

export const LIGHT_HEADER = {
	statusBar: {
		backgroundColor: '#FFF',
		style: 'dark'
	},
	topBar: {
		backButton: {
			showTitle: false,
			color: '#1d74f5'
		},
		background: {
			color: undefined
		},
		title: {
			color: '#0C0D0F'
		},
		leftButtonStyle: {
			color: '#1d74f5'
		},
		rightButtonStyle: {
			color: '#1d74f5'
		}
	}
};

export const DEFAULT_HEADER = {
	...Platform.select({
		ios: {
			...LIGHT_HEADER
		},
		android: {
			...DARK_HEADER
		}
	})
};
