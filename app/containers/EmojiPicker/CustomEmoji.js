import React from 'react';
import PropTypes from 'prop-types';
import { CachedImage } from 'react-native-img-cache';
import { connect } from 'react-redux';
import equal from 'deep-equal';
@connect(state => ({
	baseUrl: state.settings.Site_Url
}))
export default class extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		emoji: PropTypes.object.isRequired,
		style: PropTypes.object
	}
	shouldComponentUpdate(nextProps) {
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
