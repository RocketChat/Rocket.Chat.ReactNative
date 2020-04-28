import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { connect } from 'react-redux';

import database from '../lib/database';
import { requireAuthentication } from '../utils/localAuthentication';

const Blur = ({ appBackground, server }) => {
	const [show, setShow] = useState(true);

	const checkAuthentication = async() => {
		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');

		let serverRecord;
		try {
			serverRecord = await serversCollection.find(server);
		} catch (error) {
			return;
		}

		if (requireAuthentication(serverRecord)) {
			setShow(true);
		}
	};

	useEffect(() => {
		if (appBackground) {
			checkAuthentication();
		} else {
			setTimeout(() => {
				setShow(false);
			}, 300);
		}
	}, [appBackground]);

	if (show) {
		return (
			<BlurView
				style={{ ...StyleSheet.absoluteFill }}
				blurAmount={10}
			/>
		);
	}
	return null;
};

Blur.propTypes = {
	appBackground: PropTypes.string,
	server: PropTypes.string
};

const mapStateToProps = state => ({
	appBackground: state.app.background,
	server: state.server.server
});

export default connect(mapStateToProps)(Blur);
