import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SplashScreen from 'react-native-splash-screen';

import { appInit } from '../actions';
import { deepLinkingOpen } from '../actions/deepLinking';
import AuthRoutes from './routes/AuthRoutes';
import PublicRoutes from './routes/PublicRoutes';
import * as NavigationService from './routes/NavigationService';
import parseQuery from '../lib/methods/helpers/parseQuery';

@connect(
	state => ({
		login: state.login,
		app: state.app,
		background: state.app.background
	}),
	dispatch => bindActionCreators({
		appInit, deepLinkingOpen
	}, dispatch)
)
export default class Routes extends React.Component {
	static propTypes = {
		login: PropTypes.object.isRequired,
		app: PropTypes.object.isRequired,
		appInit: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);
		this.handleOpenURL = this.handleOpenURL.bind(this);
	}

	componentDidMount() {
		if (this.props.app.ready) {
			return SplashScreen.hide();
		}
		this.props.appInit();

		Linking
			.getInitialURL()
			.then(url => this.handleOpenURL({ url }))
			.catch(console.error);
		Linking.addEventListener('url', this.handleOpenURL);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.app.ready && this.props.app.ready !== nextProps.app.ready) {
			SplashScreen.hide();
		}
	}

	componentDidUpdate() {
		NavigationService.setNavigator(this.navigator);
	}

	handleOpenURL({ url }) {
		if (url) {
			url = url.replace(/rocketchat:\/\/|https:\/\/go.rocket.chat\//, '');
			const regex = /^(room|auth)\?/;
			if (url.match(regex)) {
				url = url.replace(regex, '');
				const params = parseQuery(url);
				this.props.deepLinkingOpen(params);
			}
		}
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
