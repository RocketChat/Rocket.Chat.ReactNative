import React from 'react';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';

export default class CustomEmoji extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		emoji: PropTypes.object.isRequired,
		style: PropTypes.any
	}

	shouldComponentUpdate() {
		return false;
	}

	render() {
		const { baseUrl, emoji, style } = this.props;
		return (
			<FastImage
				style={style}
				source={{
					uri: `${ baseUrl }/emoji-custom/${ encodeURIComponent(emoji.content || emoji.name) }.${ emoji.extension }`,
					priority: FastImage.priority.high
				}}
				resizeMode={FastImage.resizeMode.contain}
			/>
		);
	}
}
