import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import VideoPlayer from 'react-native-video-controls';
import Video from 'react-native-video';
import RocketChat from '../../lib/rocketchat';

import { connect } from 'react-redux';
import { setToken } from '../../actions/login';


const styles = {
	modal: {
		margin: 0,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#000'
	}, backgroundVideo: {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
	  },
};

@connect(state => ({
	server: state.server.server,
	user: state.login.user
}), dispatch => ({
	setToken: token => dispatch(setToken(token))
}))
export default class extends React.PureComponent {
	static propTypes = {
		uri: PropTypes.string.isRequired,
		isVisible: PropTypes.bool,
		onClose: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);
		this.state = {
			uri: '',
			loading: true
		};
	}

	async componentWillMount() {
		const newUri = await RocketChat.resolveFile(this.props.uri);
		console.warn(newUri);
		this.setState({ uri: newUri, loading: false });
		// this.props.setToken({token: newUri});
	}

	renderVideo() {
		if (this.state.loading) {
			return <Text style={{ color: '#fff' }}>Loading...</Text>;
		}

		return (
			<Video
				source={{ uri: this.props.uri }}
				style={styles.backgroundVideo}
				// onBack={this.props.onClose}
				// disableVolume
			/>
		);
	}

	render() {
		const { isVisible } = this.props;
		return (
			<Modal
				isVisible={isVisible}
				style={styles.modal}
				supportedOrientations={['portrait', 'landscape']}
			>
				{this.renderVideo()}
			</Modal>
		);
	}
}
