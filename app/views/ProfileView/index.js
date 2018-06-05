import React from 'react';
import { Text, View } from 'react-native';

import LoggedView from '../View';

export default class ProfileView extends LoggedView {
	constructor(props) {
		super('ProfileView', props);
	}

	render() {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<Text>ProfileView</Text>
			</View>
		);
	}
}
