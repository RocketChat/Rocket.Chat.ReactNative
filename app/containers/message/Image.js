import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FastImage from 'react-native-fast-image';
import equal from 'deep-equal';
import Touchable from 'react-native-platform-touchable';

import PhotoModal from './PhotoModal';
import Markdown from './Markdown';
import styles from './styles';

export default class extends Component {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired,
		customEmojis: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object
		])
	}

	state = { modalVisible: false, isPressed: false };

	shouldComponentUpdate(nextProps, nextState) {
		const { modalVisible, isPressed } = this.state;
		const { file } = this.props;
		if (nextState.modalVisible !== modalVisible) {
			return true;
		}
		if (nextState.isPressed !== isPressed) {
			return true;
		}
		if (!equal(nextProps.file, file)) {
			return true;
		}
		return false;
	}

	onPressButton = () => {
		this.setState({
			modalVisible: true
		});
	}

	getDescription() {
		const {
			file, customEmojis, baseUrl, user
		} = this.props;
		if (file.description) {
			return <Markdown msg={file.description} customEmojis={customEmojis} baseUrl={baseUrl} username={user.username} />;
		}
	}

	isPressed = (state) => {
		this.setState({ isPressed: state });
	}

	render() {
		const { modalVisible, isPressed } = this.state;
		const { baseUrl, file, user } = this.props;
		const img = file.image_url.includes('http') ? file.image_url : `${ baseUrl }${ file.image_url }?rc_uid=${ user.id }&rc_token=${ user.token }`;

		if (!img) {
			return null;
		}

		return (
			[
				<Touchable
					key='image'
					onPress={this.onPressButton}
					style={styles.imageContainer}
					background={Touchable.Ripple('#fff')}
				>
					<React.Fragment>
						<FastImage
							style={[styles.image, isPressed && { opacity: 0.5 }]}
							source={{ uri: encodeURI(img) }}
							resizeMode={FastImage.resizeMode.cover}
						/>
						{this.getDescription()}
					</React.Fragment>
				</Touchable>,
				<PhotoModal
					key='modal'
					title={file.title}
					description={file.description}
					image={img}
					isVisible={modalVisible}
					onClose={() => this.setState({ modalVisible: false })}
				/>
			]
		);
	}
}
