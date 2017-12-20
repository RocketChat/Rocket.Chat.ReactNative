import PropTypes from 'prop-types';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { appInit } from '../actions';

import AuthRoutes from './routes/AuthRoutes';
import PublicRoutes from './routes/PublicRoutes';
import Loading from '../presentation/Loading';
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

	componentWillMount() {
		return !this.props.app.ready && this.props.appInit();
	}

	componentDidUpdate() {
		NavigationService.setNavigator(this.navigator);
	}

	render() {
		const { login, app } = this.props;

		if (app.starting) {
			return (<Loading />);
		}

		if (!login.token || login.isRegistering) {
			return (<PublicRoutes ref={nav => this.navigator = nav} />);
		}
		return (<AuthRoutes ref={nav => this.navigator = nav} />);
	}
}
