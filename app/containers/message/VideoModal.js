import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import VideoPlayer from 'react-native-video-controls';


const styles = {
	modal: {
		margin: 0,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#000'
	}
};
export default class extends React.PureComponent {
	static propTypes = {
		uri: PropTypes.string.isRequired,
		isVisible: PropTypes.bool,
		onClose: PropTypes.func.isRequired
	}

	renderVideo() {
		return (
			<VideoPlayer
				source={{ uri: this.props.uri }}
				onBack={this.props.onClose}
				disableVolume
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
