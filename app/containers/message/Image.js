import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { RectButton } from 'react-native-gesture-handler';

import PhotoModal from './PhotoModal';
import Markdown from './Markdown';
import styles from './styles';

export default class extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired,
		customEmojis: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object
		])
	}

	state = { modalVisible: false };

	onPressButton() {
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
		const { isPressed } = this.state;
		const { baseUrl, file, user } = this.props;
		const img = `${ baseUrl }${ file.image_url }?rc_uid=${ user.id }&rc_token=${ user.token }`;

		if (!baseUrl) {
			return null;
		}

		return (
			[
				<RectButton
					key='image'
					onPress={() => this.onPressButton()}
					onActiveStateChange={this.isPressed}
					style={styles.imageContainer}
					underlayColor='#fff'
				>
					<FastImage
						style={[styles.image, isPressed && { opacity: 0.5 }]}
						source={{ uri: encodeURI(img) }}
						resizeMode={FastImage.resizeMode.cover}
					/>
					{this.getDescription()}
				</RectButton>,
				<PhotoModal
					key='modal'
					title={file.title}
					description={file.description}
					image={img}
					isVisible={this.state.modalVisible}
					onClose={() => this.setState({ modalVisible: false })}
				/>
			]
		);
	}
}
