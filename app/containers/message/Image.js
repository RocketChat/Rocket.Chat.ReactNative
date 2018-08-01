import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';

import PhotoModal from './PhotoModal';
import Markdown from './Markdown';
import styles from './styles';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}))
export default class extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired,
		customEmojis: PropTypes.object
	}

	state = { modalVisible: false };

	getDescription() {
		const { file, customEmojis } = this.props;
		if (file.description) {
			return <Markdown msg={file.description} customEmojis={customEmojis} />;
		}
	}

	_onPressButton() {
		this.setState({
			modalVisible: true
		});
	}

	render() {
		const { baseUrl, file, user } = this.props;
		const img = `${ baseUrl }${ file.image_url }?rc_uid=${ user.id }&rc_token=${ user.token }`;
		return (
			[
				<TouchableOpacity
					key='image'
					onPress={() => this._onPressButton()}
					style={styles.imageContainer}
				>
					<FastImage
						style={styles.image}
						source={{ uri: encodeURI(img) }}
					/>
					{this.getDescription()}
				</TouchableOpacity>,
				<PhotoModal
					key='modal'
					title={this.props.file.title}
					description={this.props.file.description}
					image={img}
					isVisible={this.state.modalVisible}
					onClose={() => this.setState({ modalVisible: false })}
				/>
			]
		);
	}
}
