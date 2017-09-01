import PropTypes from 'prop-types';
import React from 'react';
import { View, Image } from 'react-native';
import { connect } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import setNavigator from './actions/navigator';
import { appInit } from './actions';
import LoginView from './views/login';
import ListServerView from './views/serverList';


import styles from './views/Styles';

import store from './lib/createStore';

export const authenticated = WrappedComponent => class _p extends React.PureComponent {
	constructor() {
		super();
		this.login = store.getState().login;
		if (!this.login.token || this.login.failure) {
			return store.getState().navigator.resetTo({
				screen: 'Login',
				animated: false
			});
		}
	}
	render() {
		// Wraps the input component in a container, without mutating it. Good!
		return ((this.login.isAuthenticated || this.login.user) && <WrappedComponent {...this.props} />);
	}
};
//
export class PublicScreen extends React.PureComponent {
	render() {
		return ((this.login.isAuthenticated || this.login.user) && <ListServerView {...this.props} />);
	}
}


@connect(null, dispatch => ({
	setNavigator: navigator => dispatch(setNavigator(navigator))
}))
export class PrivateScreen extends React.PureComponent {
	render() {
		return (<LoginView {...this.props} />);
	}
}
@connect(() => ({
	// logged: state.login.isAuthenticated
}), dispatch => ({
	setNavigator: navigator => dispatch(setNavigator(navigator)),
	appInit: () => dispatch(appInit())
}))
export const HomeScreen = class extends React.PureComponent {
	static propTypes = {
		appInit: PropTypes.func.isRequired,
		setNavigator: PropTypes.func.isRequired,
		navigator: PropTypes.object.isRequired
	}
	static navigatorStyle = {
		navBarHidden: true,

		rightButtons: [{
			id: 'close',
			title: 'Cancel'
		}]
	};
	componentWillMount() {
		this.props.setNavigator(this.props.navigator);
		this.props.appInit();
		//
		// this.props.navigator.setDrawerEnabled({
		// 	side: 'left', // the side of the drawer since you can have two, 'left' / 'right'
		// 	enabled: false // should the drawer be enabled or disabled (locked closed)
		// });
	}
	render() {
		return (<View style={styles.logoContainer}><Animatable.Text animation='pulse' easing='ease-out' iterationCount='infinite' style={{ textAlign: 'center' }}>
			<Image style={styles.logo} source={require('./images/logo.png')} />
		</Animatable.Text></View>);
	}
};
