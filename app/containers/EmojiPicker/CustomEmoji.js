import React from 'react';
import { ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import { CachedImage } from 'react-native-img-cache';
import { connect } from 'react-redux';

@connect(state => ({
	baseUrl: state.settings.Site_Url
}))
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
			<CachedImage
				style={style}
				source={{ uri: `${ baseUrl }/emoji-custom/${ encodeURIComponent(emoji.content || emoji.name) }.${ emoji.extension }` }}
			/>
		);
	}
}
