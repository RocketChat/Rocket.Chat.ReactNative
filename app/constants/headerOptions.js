import { Platform } from 'react-native';

export const DARK_HEADER = {
	statusBar: {
		backgroundColor: '#2F343D',
		style: 'light'
	},
	topBar: {
		backButton: {
			color: '#FFF'
		},
		background: {
			color: '#2F343D'
		},
		title: {
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
			color: undefined
		},
		background: {
			color: undefined
		},
		title: {
			color: '#0C0D0F'
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
