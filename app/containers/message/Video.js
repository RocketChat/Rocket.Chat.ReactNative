import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import VideoModal from './VideoModal';

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

@connect(state => ({
	server: state.server.server,
	user: state.login.user
}))
export default class Video extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		server: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);
		const { server, file, user } = this.props;
		this.state = {
			modalVisible: false,
			uri: `${ server }${ file.video_url }?rc_uid=${ user.id }&rc_token=${ user.token }`
		};
		// this.setState({ img: `${ this.props.base }${ this.props.data.image_url }?rc_uid=${ user._id }&rc_token=${ token }` });
		console.warn(this.state.uri)
	}

	toggleModal() {
		this.setState({
			modalVisible: !this.state.modalVisible
		});
	}

	render() {
		const { modalVisible, uri } = this.state;
		return (
			<View>
				<TouchableOpacity
					style={styles.container}
					onPress={() => this.toggleModal()}
				>
					<Text>Open</Text>
				</TouchableOpacity>
				<VideoModal
					uri={uri}
					isVisible={modalVisible}
					onClose={() => this.toggleModal()}
				/>
			</View>
		);
	}
}
