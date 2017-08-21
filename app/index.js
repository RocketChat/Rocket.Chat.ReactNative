import React from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import setNavigator from './actions/navigator';
import LoginView from './views/login';
import ListServerView from './views/serverList';

import store from './lib/createStore';

//
// export const authenticated = (view) => {
// 	if (!store.getState().login.authenticated) {
// 		return store.getState().navigator.resetTo({
// 			screen: 'Login'
// 		});
// 	}
// 	return view;
// };

export const authenticated = WrappedComponent => class _p extends React.PureComponent {
	constructor() {
		super();
		this.login = store.getState().login;
		console.log('this.login.token', this.login.token);
		if (!this.login.token || this.login.failure) {
			return store.getState().navigator.resetTo({
				screen: 'Login'
			});
		}
	}
	render() {
		// Wraps the input component in a container, without mutating it. Good!
		return <WrappedComponent {...this.props} />;
	}
};
//
export class PublicScreen extends React.PureComponent {
	// componentWillMount() {
	// 	this.props.setNavigator(this.props.navigator);
	// 	if (this.props.currentServer) {
	// 		return this.props.navigator.navigate('private');
	// 	}
	// }
	render() {
		return !this.login.isAuthenticated || !this.login.user ? null : (<ListServerView {...this.props} />);
	}
}


@connect(null, dispatch => ({
	setNavigator: navigator => dispatch(setNavigator(navigator))
}))
export class PrivateScreen extends React.PureComponent {
	componentWillMount() {
		// this.props.setNavigator(this.props.navigator);
	}
	render() {
		// if (this.props.logged) {
		// 	return (<Text>oi</Text>);
		// }
		return (<LoginView {...this.props} />);
	}
}
@connect(state => ({
	// logged: state.login.isAuthenticated
}), dispatch => ({
	// navigate: routeName => dispatch(NavigationActions.navigate({ routeName })),
	setNavigator: navigator => dispatch(setNavigator(navigator))
}))
export const HomeScreen = class extends React.PureComponent {
	componentWillMount() {
		this.props.setNavigator(this.props.navigator);
		this.props.navigator.resetTo({
			screen: 'public'
		});
	}
	render() {
		return (<Text>oieee</Text>);
	}
};
