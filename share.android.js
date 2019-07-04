import React, { Component } from 'react';

import {
	Text,
	View,
	TouchableOpacity
} from 'react-native';

export default class Share extends Component {
	componentDidMount() {
		console.log('[MOUNT]');
	}

	render() {
		return (
			<View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
				<View
					style={{
						borderColor: 'green', borderWidth: 1, backgroundColor: 'white', height: 200, width: 300
					}}
				>
					<TouchableOpacity>
						<Text>Close</Text>
						<Text>type</Text>
						<Text>value</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}
}
