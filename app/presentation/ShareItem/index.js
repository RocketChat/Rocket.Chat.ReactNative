import React from 'react';
import PropTypes from 'prop-types';
import { Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import Avatar from '../../containers/Avatar';

import styles from './styles';
import DisclosureIndicator from '../../containers/DisclosureIndicator';

export const ROW_HEIGHT = 56;

@connect(state => ({
	userId: state.login.user && state.login.user.id,
	token: state.login.user && state.login.user.token,
	baseUrl: state.settings.baseUrl || state.server ? state.server.server : ''
}))
/** @extends React.Component */
export default class ShareItem extends React.Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		token: PropTypes.string,
		userId: PropTypes.string,
		baseUrl: PropTypes.string,
		onPress: PropTypes.func
	}

	render() {
		const {
			baseUrl, userId, token, name, type, onPress
		} = this.props;

		return (
			<RectButton
				onPress={onPress}
			>
				<View style={styles.content}>
					<Avatar text={name} size={24} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} />
					<View
						style={styles.center}
					>
						<Text style={styles.name} ellipsizeMode='tail' numberOfLines={1}>{name}</Text>
						<DisclosureIndicator />
					</View>
				</View>
			</RectButton>
		);
	}
}
