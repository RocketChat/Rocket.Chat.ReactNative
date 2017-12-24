import React from 'react';

import PropTypes from 'prop-types';
import { StyleSheet, Text } from 'react-native';
import { connect } from 'react-redux';

const styles = StyleSheet.create({
	typing: {

		transform: [{ scaleY: -1 }],
		fontWeight: 'bold',
		paddingHorizontal: 15,
		height: 25
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
	get usersTyping() {
		const users = this.props.usersTyping.filter(_username => this.props.username !== _username);
		return users.length ? `${ users.join(' ,') } ${ users.length > 1 ? 'are' : 'is' } typing` : '';
	}
	render() {
		return (<Text style={styles.typing}>{this.usersTyping}</Text>);
	}
}


Typing.propTypes = {
	username: PropTypes.string,
	usersTyping: PropTypes.array
};
