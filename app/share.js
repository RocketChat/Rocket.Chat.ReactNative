import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import { Provider } from 'react-redux';
import ShareExtension from 'react-native-share-extension';

import { appInit } from './actions';
import store from './lib/createStore';

export class Home extends React.Component {
	static navigationOptions = () => ({
		headerLeft: (
			<TouchableOpacity onPress={() => ShareExtension.close()}>
				<Text>cancel</Text>
			</TouchableOpacity>
		),
		title: 'Selecionar Canais',
		headerRight: null
	})

	constructor(props) {
		super(props);
		this.state = {
			type: '',
			value: ''
		};
	}

	componentWillMount() {
		ShareExtension.data()
			.then(({ type, value }) => this.setState({ type, value }));
	}

	render() {
		const { type, value } = this.state;
		return (
			<View
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					flex: 1,
					backgroundColor: 'red'
				}}
			>
				<TouchableOpacity onPress={() => ShareExtension.close()}>
					<Text style={{ fontSize: 36 }}>X</Text>
				</TouchableOpacity>
				<Text style={{ fontSize: 36 }}>{type}</Text>
				<Text style={{ fontSize: 11 }}>{value}</Text>
			</View>
		);
	}
}

const Navigator = createStackNavigator({
	Home
});

const AppContainer = createAppContainer(Navigator);
class Root extends React.Component {
	constructor(props) {
		super(props);
		store.dispatch(appInit());
	}

	render() {
		return (
			<Provider store={store}>
				<AppContainer />
			</Provider>
		);
	}
}

export default Root;
