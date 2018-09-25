import React from 'react';
import { ViewPropTypes, Image } from 'react-native';
import PropTypes from 'prop-types';

export default class CustomEmoji extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		emoji: PropTypes.object.isRequired,
		style: ViewPropTypes.style
	}

	shouldComponentUpdate() {
		return false;
	}

	render() {
		const { baseUrl, emoji, style } = this.props;
		return (
			<Image
				style={style}
				source={{ uri: `${ baseUrl }/emoji-custom/${ encodeURIComponent(emoji.content || emoji.name) }.${ emoji.extension }` }}
			/>
		);
	}
}
