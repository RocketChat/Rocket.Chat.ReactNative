import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, Text, Keyboard, LayoutAnimation } from 'react-native';
import { connect } from 'react-redux';
import I18n from '../i18n';

const styles = StyleSheet.create({
	typing: {
		transform: [{ scaleY: -1 }],
		fontWeight: 'bold',
		paddingHorizontal: 15,
		height: 25
	},
	emptySpace: {
		height: 5
	}
});

@connect(state => ({
	username: state.login.user && state.login.user.username,
	usersTyping: state.room.usersTyping
}))
export default class Typing extends React.Component {
	shouldComponentUpdate(nextProps) {
		return this.props.usersTyping.join() !== nextProps.usersTyping.join();
	}
	componentWillUpdate() {
		LayoutAnimation.easeInEaseOut();
	}
	onPress = () => {
		Keyboard.dismiss();
	}
	get usersTyping() {
		const users = this.props.usersTyping.filter(_username => this.props.username !== _username);
		return users.length ? `${ users.join(', ') } ${ users.length > 1 ? I18n.t('are_typing') : I18n.t('is_typing') }` : '';
	}
	render() {
		const { usersTyping } = this;

		if (!usersTyping) {
			return <View style={styles.emptySpace} />;
		}

		return (<Text style={styles.typing} onPress={() => this.onPress()}>{usersTyping}</Text>);
	}
}


Typing.propTypes = {
	username: PropTypes.string,
	usersTyping: PropTypes.array
};
