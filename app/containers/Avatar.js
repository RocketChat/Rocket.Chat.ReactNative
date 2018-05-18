import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { StyleSheet, Text, View, ViewPropTypes } from 'react-native';
import FastImage from 'react-native-fast-image';
import avatarInitialsAndColor from '../utils/avatarInitialsAndColor';

const styles = StyleSheet.create({
	iconContainer: {
		// overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center'
	},
	avatar: {
		position: 'absolute'
	},
	avatarInitials: {
		color: '#ffffff'
	}
});

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}))
export default class Avatar extends React.PureComponent {
	static propTypes = {
		style: ViewPropTypes.style,
		baseUrl: PropTypes.string,
		text: PropTypes.string.isRequired,
		avatar: PropTypes.string,
		size: PropTypes.number,
		borderRadius: PropTypes.number,
		type: PropTypes.string,
		children: PropTypes.object
	};
	state = { showInitials: true };
	render() {
		const {
			text = '', size = 25, baseUrl, borderRadius = 2, style, avatar, type = 'd'
		} = this.props;
		const { initials, color } = avatarInitialsAndColor(`${ text }`);

		const iconContainerStyle = {
			backgroundColor: color,
			width: size,
			height: size,
			borderRadius
		};

		const avatarInitialsStyle = {
			fontSize: size / 1.6,
			fontWeight: '800'
		};

		const avatarStyle = {
			width: size,
			height: size,
			borderRadius
		};

		let image;

		if (type === 'd') {
			const uri = avatar || `${ baseUrl }/avatar/${ text }`;
			image = uri && (
				<FastImage
					style={[styles.avatar, avatarStyle]}
					source={{
						uri,
						priority: FastImage.priority.high
					}}
				/>
			);
		}

		return (
			<View style={[styles.iconContainer, iconContainerStyle, style]}>
				{this.state.showInitials &&
					<Text
						style={[styles.avatarInitials, avatarInitialsStyle]}
						allowFontScaling={false}
					>
						{initials}
					</Text>
				}
				{image}
				{this.props.children}
			</View>
		);
	}
}
