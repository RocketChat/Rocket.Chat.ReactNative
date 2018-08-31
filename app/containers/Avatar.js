import React from 'react';
import PropTypes from 'prop-types';
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

export default class Avatar extends React.PureComponent {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		style: ViewPropTypes.style,
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
		borderRadius: 4,
		forceInitials: false
	};
	state = { showInitials: true };

	// componentDidMount() {
	// 	const { text, type } = this.props;
	// 	if (type === 'd') {
	// 		this.users = this.userQuery(text);
	// 		this.users.addListener(this.update);
	// 		this.update();
	// 	}
	// }

	// componentWillReceiveProps(nextProps) {
	// 	if (nextProps.text !== this.props.text && nextProps.type === 'd') {
	// 		if (this.users) {
	// 			this.users.removeAllListeners();
	// 		}
	// 		this.users = this.userQuery(nextProps.text);
	// 		this.users.addListener(this.update);
	// 		this.update();
	// 	}
	// }

	// componentWillUnmount() {
	// 	if (this.users) {
	// 		this.users.removeAllListeners();
	// 	}
	// }

	// get avatarVersion() {
	// 	// return (this.state.user && this.state.user.avatarVersion) || 0;
	// 	return 0;
	// }

	/** FIXME: Workaround
	 * While we don't have containers/components structure, this is breaking tests.
	 * In that case, avatar would be a component, it would receive an `avatarVersion` param
	 * and we would have a avatar container in charge of making queries.
	 * Also, it would make possible to write unit tests like these.
	*/
	// userQuery = (username) => {
	// 	if (database && database.databases && database.databases.activeDB) {
	// 		return database.objects('users').filtered('username = $0', username);
	// 	}
	// 	return {
	// 		addListener: () => {},
	// 		removeAllListeners: () => {}
	// 	};
	// }

	// update = () => {
	// 	if (this.users.length) {
	// 		this.setState({ user: this.users[0] });
	// 	}
	// }

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
			const uri = avatar || `${ baseUrl }/avatar/${ text }`;
			image = uri ? (
				<FastImage
					style={[styles.avatar, avatarStyle]}
					source={{
						uri,
						priority: FastImage.priority.high
					}}
				/>
			) : null;
		}

		return (
			<View style={[styles.iconContainer, iconContainerStyle, style]}>
				{this.state.showInitials ?
					<Text
						style={[styles.avatarInitials, avatarInitialsStyle]}
						allowFontScaling={false}
					>
						{initials}
					</Text>
					: null
				}
				{image}
				{this.props.children}
			</View>
		);
	}
}
