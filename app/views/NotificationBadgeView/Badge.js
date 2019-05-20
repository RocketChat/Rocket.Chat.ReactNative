import React from 'react';
import {
	View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { CustomIcon } from '../../lib/Icons';
import { COLOR_TITLE, COLOR_TEXT, COLOR_BACKGROUND_CONTAINER } from '../../constants/colors';
import Avatar from '../../containers/Avatar';
import Navigation from '../../lib/Navigation';
import log from '../../utils/log';

const AVATAR_SIZE = 40;
const ANIMATION_DURATION = 300;
const { width } = Dimensions.get('window');
const MAX_WIDTH_MESSAGE = width - 100;

const styles = StyleSheet.create({
	container: {
		minHeight: 50,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		position: 'absolute',
		zIndex: -2,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		width: '100%'
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around'
	},
	avatar: {
		marginHorizontal: 10
	},
	roomName: {
		color: COLOR_TEXT
	},
	message: {
		maxWidth: MAX_WIDTH_MESSAGE
	},
	close: {
		color: COLOR_TITLE,
		marginHorizontal: 10
	}
});
@connect(state => ({
	userId: state.login.user && state.login.user.id,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	token: state.login.user && state.login.user.token
}))
export default class Badge extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		token: PropTypes.string,
		userId: PropTypes.string,
		data: PropTypes.object,
		message: PropTypes.string
	}

	constructor(props) {
		super('Badge', props);
		this.animatedValue = new Animated.Value(0);
	}

	componentDidMount() {
		this.show();
	}

	componentDidUpdate() {
		this.show();
	}

	show = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				duration: ANIMATION_DURATION,
				easing: Easing.ease,
				useNativeDriver: true
			},
		).start(() => {
			setTimeout(() => {
				this.hide();
			}, 10000);
		});
	}

	hide = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				duration: ANIMATION_DURATION,
				easing: Easing.ease,
				useNativeDriver: true
			},
		).start();
	}

	goToRoom = () => {
		const { data } = this.props;
		const { rid, type, prid } = data;
		const name = data === 'p' ? data.name : data.sender.username;
		Navigation.navigate('RoomView', {
			rid, name, t: type, prid
		});
		this.hide();
	}

	render() {
		log('manu');
		const {
			baseUrl, token, userId, data, message
		} = this.props;
		const { type } = data;
		const name = data === 'p' ? data.name : data.sender.username;

		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 0.001, 1],
			outputRange: [-50, 0, 50]
		});

		return (
			<Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
				<TouchableOpacity style={styles.content} onPress={this.goToRoom}>
					<Avatar text={name} size={AVATAR_SIZE} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} />
					<View>
						<Text style={styles.roomName}>{name}</Text>
						<Text style={styles.message} numberOfLines={1}>{message}</Text>
					</View>
				</TouchableOpacity>
				<TouchableOpacity onPress={this.hide}>
					<CustomIcon name='circle-cross' style={styles.close} size={20} />
				</TouchableOpacity>
			</Animated.View>
		);
	}
}
