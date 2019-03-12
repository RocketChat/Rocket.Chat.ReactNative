import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import StatusBar from '../containers/StatusBar';
import { isAndroid } from '../utils/deviceInfo';
import { appInit as appInitAction } from '../actions';

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%'
	}
});

@connect(null, dispatch => ({
	appInit: () => dispatch(appInitAction())
}))
export default class Loading extends React.PureComponent {
	static propTypes = {
		appInit: PropTypes.func
	}

	constructor(props) {
		super(props);
		props.appInit();
	}

	render() {
		return (
			<React.Fragment>
				<StatusBar />
				{isAndroid ? <Image source={{ uri: 'launch_screen' }} style={styles.image} /> : null}
			</React.Fragment>
		);
	}
}
