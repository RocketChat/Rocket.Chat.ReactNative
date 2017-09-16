import PropTypes from 'prop-types';
import React from 'react';
import { View, Image } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import { appInit } from '../actions';

import styles from '../views/Styles';

import AuthRoutes from './routes/AuthRoutes';
import PublicRoutes from './routes/PublicRoutes';

@connect(
	state => ({
		login: state.login,
		app: state.app
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
		this.props.appInit();
	}
	render() {
		const { login, app } = this.props;

		if (app.starting) {
			return (
				<View style={styles.logoContainer}>
					<Animatable.Text
						animation='pulse'
						easing='ease-out'
						iterationCount='infinite'
						style={{ textAlign: 'center' }}
					>
						<Image style={styles.logo} source={require('../images/logo.png')} />
					</Animatable.Text>
				</View>
			);
		}

		if ((login.token && !login.failure) || app.ready) {
			return (<AuthRoutes />);
		}

		return (<PublicRoutes />);
	}
}
