import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { View, Text, Switch, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

import RCTextInput from '../containers/TextInput';
import Loading from '../containers/Loading';
import LoggedView from './View';
import { createChannelRequest } from '../actions/createChannel';
import styles from './Styles';
import KeyboardView from '../presentation/KeyboardView';
import scrollPersistTaps from '../utils/scrollPersistTaps';

@connect(
	state => ({
		createChannel: state.createChannel,
		users: state.selectedUsers.users
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
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.containerScrollView}>
					<SafeAreaView>
						<RCTextInput
							label='Channel Name'
							value={this.state.channelName}
							onChangeText={channelName => this.setState({ channelName })}
							placeholder='Type the channel name here'
							returnKeyType='done'
							autoFocus
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
							style={[
								styles.buttonContainer_white,
								this.state.channelName.length === 0 || this.props.createChannel.isFetching
									? styles.disabledButton
									: styles.enabledButton
							]}
						>
							<Text style={styles.button_white}>CREATE</Text>
						</TouchableOpacity>
						<Loading visible={this.props.createChannel.isFetching} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
