import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { TextInput, View, Text, Switch, TouchableOpacity, SafeAreaView } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

import LoggedView from './View';
import { createChannelRequest } from '../actions/createChannel';
import styles from './Styles';
import KeyboardView from '../presentation/KeyboardView';

@connect(
	state => ({
		createChannel: state.createChannel,
		users: state.createChannel.users
	}),
	dispatch => ({
		create: data => dispatch(createChannelRequest(data))
	})
)
export default class CreateChannelView extends LoggedView {
	static navigationOptions = () => ({
		title: 'Create a New Channel'
	});
	static propTypes = {
		create: PropTypes.func.isRequired,
		createChannel: PropTypes.object.isRequired,
		users: PropTypes.array.isRequired,
		navigation: PropTypes.object.isRequired
	};

	constructor(props) {
		super('CreateChannelView', props);
		this.state = {
			channelName: '',
			type: true
		};
	}

	submit() {
		if (!this.state.channelName.trim() || this.props.createChannel.isFetching) {
			return;
		}
		const { channelName, type = true } = this.state;
		let { users } = this.props;

		// transform users object into array of usernames
		users = users.map(user => user.name);

		// create channel
		this.props.create({ name: channelName, users, type });
	}

	renderChannelNameError() {
		if (
			!this.props.createChannel.failure ||
			this.props.createChannel.error.error !== 'error-duplicate-channel-name'
		) {
			return null;
		}

		return (
			<Text style={[styles.label_white, styles.label_error]}>
				{this.props.createChannel.error.reason}
			</Text>
		);
	}

	renderTypeSwitch() {
		return (
			<View style={[styles.view_white, styles.switchContainer]}>
				<Switch
					style={[{ flexGrow: 0, flexShrink: 1 }]}
					value={this.state.type}
					onValueChange={type => this.setState({ type })}
				/>
				<Text style={[styles.label_white, styles.switchLabel]}>
					{this.state.type ? 'Public' : 'Private'}
				</Text>
			</View>
		);
	}

	render() {
		return (
			<KeyboardView
				style={[styles.defaultViewBackground, { flex: 1 }]}
				contentContainerStyle={styles.defaultView}
			>
				<SafeAreaView style={styles.formContainer}>
					<Text style={styles.label_white}>Channel Name</Text>
					<TextInput
						value={this.state.channelName}
						style={styles.input_white}
						onChangeText={channelName => this.setState({ channelName })}
						autoCorrect={false}
						returnKeyType='done'
						autoCapitalize='none'
						autoFocus
						placeholder='Type the channel name here'
					/>
					{this.renderChannelNameError()}
					{this.renderTypeSwitch()}
					<Text
						style={[
							styles.label_white,
							{
								color: '#9ea2a8',
								flexGrow: 1,
								paddingHorizontal: 0,
								marginBottom: 20
							}
						]}
					>
						{this.state.type ? (
							'Everyone can access this channel'
						) : (
							'Just invited people can access this channel'
						)}
					</Text>
					<TouchableOpacity
						onPress={() => this.submit()}
						style={[styles.buttonContainer_white, styles.enabledButton]}
					>
						<Text style={styles.button_white}>CREATE</Text>
					</TouchableOpacity>
				</SafeAreaView>
				<Spinner
					visible={this.props.createChannel.isFetching}
					textContent='Loading...'
					textStyle={{ color: '#FFF' }}
				/>
			</KeyboardView>
		);
	}
}
