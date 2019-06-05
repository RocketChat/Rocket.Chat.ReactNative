import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import Avatar from '../../containers/Avatar';

import styles, { ROW_HEIGHT } from './styles';

export { ROW_HEIGHT };

@connect(state => ({
	userId: state.login.user && state.login.user.id,
	token: state.login.user && state.login.user.token
}))
/** @extends React.Component */
export default class ShareItem extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		token: PropTypes.string,
		userId: PropTypes.string,
		onPress: PropTypes.func
	}

	render() {
		const {
			baseUrl, userId, token, name, type, onPress
		} = this.props;

		return (
			<RectButton
				onPress={onPress}
				style={styles.content}
			>
				<Avatar text={name} size={24} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} />
				<Text style={styles.name} ellipsizeMode='tail' numberOfLines={1}>{name}</Text>
			</RectButton>
		);
	}
}
