import React from 'react';
import PropTypes from 'prop-types';
import { CachedImage } from 'react-native-img-cache';
import { connect } from 'react-redux';

@connect(state => ({
	baseUrl: state.settings.Site_Url
}))
export default class extends React.PureComponent {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		emoji: PropTypes.object.isRequired,
		style: PropTypes.object
	}

	render() {
		const { baseUrl, emoji, style } = this.props;
		return (
			<CachedImage
				style={style}
				source={{ uri: `${ baseUrl }/emoji-custom/${ encodeURIComponent(emoji.content) }.${ emoji.extension }` }}
			/>
		);
	}
}
