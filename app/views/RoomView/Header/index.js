import React from 'react';
import { Text, View, Platform, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { HeaderBackButton } from 'react-navigation';

import Avatar from '../../../containers/Avatar';
import { STATUS_COLORS } from '../../../constants/colors';
import styles from './styles';

@connect(state => ({
	user: state.login.user,
	baseUrl: state.settings.Site_Url
}))
export default class extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
		baseUrl: PropTypes.string
	}

	renderLeft() {
		return (
			<HeaderBackButton onPress={() => this.props.navigation.goBack(null)} tintColor='#292E35' />
		);
	}

	renderTitle() {
		if (!this.props.user.username) {
			return null;
		}
		return (
			<TouchableOpacity style={styles.titleContainer} onPress={() => this.showModal()}>
				<View style={[styles.status, { backgroundColor: STATUS_COLORS[this.props.user.status || 'offline'] }]} />
				<Avatar
					text={this.props.user.username}
					size={24}
					style={{ marginRight: 5 }}
					baseUrl={this.props.baseUrl}
				/>
				<View style={{ flexDirection: 'column' }}>
					<Text style={styles.title}>{this.props.user.username}</Text>
					<Text style={{ fontSize: 10, color: '#888' }}>Online</Text>
				</View>
			</TouchableOpacity>
		);
	}

	renderRight = () => (
		<View style={styles.right}>
			<TouchableOpacity
				style={styles.headerButton}
				onPress={() => {}}
			>
				<Icon
					name={Platform.OS === 'ios' ? 'ios-more' : 'md-more'}
					color='#292E35'
					size={24}
					backgroundColor='transparent'
				/>
			</TouchableOpacity>
		</View>
	);

	render() {
		return (
			<View style={styles.header}>
				{this.renderLeft()}
				{this.renderTitle()}
				{this.renderRight()}
			</View>
		);
	}
}
