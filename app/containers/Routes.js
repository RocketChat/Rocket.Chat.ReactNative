import PropTypes from 'prop-types';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import { appInit } from '../actions';

import AuthRoutes from './routes/AuthRoutes';
import PublicRoutes from './routes/PublicRoutes';
import * as NavigationService from './routes/NavigationService';

@connect(
	state => ({
		login: state.login,
		app: state.app,
		background: state.app.background
	}),
	dispatch => bindActionCreators({
		appInit
	}, dispatch)
)
export default class Routes extends React.Component {
	static propTypes = {
		login: PropTypes.object.isRequired,
		app: PropTypes.object.isRequired,
		appInit: PropTypes.func.isRequired
	}

	componentDidMount() {
		if (this.props.app.ready) {
			return SplashScreen.hide();
		}
		this.props.appInit();
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.app.ready && this.props.app.ready !== nextProps.app.ready) {
			SplashScreen.hide();
		}
	}

	componentDidUpdate() {
		NavigationService.setNavigator(this.navigator);
	}

	render() {
		const { login } = this.props;

		if (this.props.app.starting) {
			return null;
		}

		if (!login.token || login.isRegistering) {
			return (<PublicRoutes ref={nav => this.navigator = nav} />);
		}
		return (<AuthRoutes ref={nav => this.navigator = nav} />);
	}
}
