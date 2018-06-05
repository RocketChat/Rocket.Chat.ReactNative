import React from 'react';
import { Text, View } from 'react-native';

import LoggedView from '../View';

export default class SettingsView extends LoggedView {
	constructor(props) {
		super('SettingsView', props);
	}

	render() {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<Text>SettingsView</Text>
			</View>
		);
	}
}
