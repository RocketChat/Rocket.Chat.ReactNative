import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { StyleSheet, Text, View, ViewPropTypes } from 'react-native';
import FastImage from 'react-native-fast-image';
import avatarInitialsAndColor from '../utils/avatarInitialsAndColor';
import database from '../lib/realm';

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
		text: PropTypes.string,
		avatar: PropTypes.string,
		size: PropTypes.number,
		borderRadius: PropTypes.number,
		type: PropTypes.string,
		children: PropTypes.object,
		forceInitials: PropTypes.bool
	};
	static defaultProps = {
		text: '',
		size: 25,
		type: 'd',
		borderRadius: 2,
		forceInitials: false
	};
	state = { showInitials: true, user: {} };

	componentDidMount() {
		const { text, type } = this.props;
		if (type === 'd') {
			this.users = database.objects('users').filtered('username = $0', text);
			this.users.addListener(this.update);
			this.update();
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.text !== this.props.text && nextProps.type === 'd') {
			if (this.users) {
				this.users.removeAllListeners();
			}
			this.users = database.objects('users').filtered('username = $0', nextProps.text);
			this.users.addListener(this.update);
			this.update();
		}
	}

	componentWillUnmount() {
		if (this.users) {
			this.users.removeAllListeners();
		}
	}

	get avatarVersion() {
		return (this.state.user && this.state.user.avatarVersion) || 0;
	}

	update = () => {
		if (this.users.length) {
			this.setState({ user: this.users[0] });
		}
	}

	render() {
		const {
			text, size, baseUrl, borderRadius, style, avatar, type, forceInitials
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

		if (type === 'd' && !forceInitials) {
			const uri = avatar || `${ baseUrl }/avatar/${ text }?random=${ this.avatarVersion }`;
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
