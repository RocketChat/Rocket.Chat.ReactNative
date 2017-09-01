
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { TextInput, View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { createChannelRequest } from '../actions/createChannel';
import styles from './Styles';
import KeyboardView from '../components/KeyboardView';

@connect(state => ({
	result: state.createChannel
}), dispatch => ({
	createChannel: data => dispatch(createChannelRequest(data))
}))

export default class CreateChannelView extends React.Component {
	static navigationOptions = () => ({
		title: 'Create a New Channel'
	});
	static propTypes = {
		createChannel: PropTypes.func.isRequired,
		result: PropTypes.object.isRequired,
		navigator: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);
		this.default = {
			channelName: '',
			type: true
		};
		this.state = this.default;
		this.props.navigator.setTitle({
			title: 'Create Channel'
		});
		// this.props.navigator.setSubTitle({
		// 	subtitle: 'Channels are where your team communicate.'
		// });
	}
	submit() {
		if (!this.state.channelName.trim() || this.props.result.isFetching) {
			return;
		}
		const { channelName, users = [], type = true } = this.state;
		this.props.createChannel({ name: channelName, users, type });
	}

	render() {
		return (
			<KeyboardView style={[styles.view_white, { flex: 0, justifyContent: 'flex-start' }]}>
				<ScrollView>
					<View style={styles.formContainer}>
						<Text style={styles.label_white}>Channel Name</Text>
						<TextInput
							value={this.state.channelName}
							style={styles.input_white}
							onChangeText={channelName => this.setState({ channelName })}
							autoCorrect={false}
							returnKeyType='done'
							autoCapitalize='none'
							autoFocus
							// onSubmitEditing={() => this.textInput.focus()}
							placeholder='Type the channel name here'
						/>
						{(this.props.result.failure && this.props.result.error.error === 'error-duplicate-channel-name') ? <Text style={[styles.label_white, { color: 'red', flexGrow: 1, paddingHorizontal: 0, marginBottom: 20 }]}>{this.props.result.error.reason}</Text> : null}
						<View style={[styles.view_white, { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 0 }]}>
							<Switch
								style={[{ flexGrow: 0, flexShrink: 1 }]}
								value={this.state.type}
								onValueChange={type => this.setState({ type })}
							/>
							<Text style={[styles.label_white, { flexGrow: 1, paddingHorizontal: 10 }]}>{this.state.type ? 'Public' : 'Private'}</Text>
						</View>
						<Text style={[styles.label_white, { color: '#9ea2a8', flexGrow: 1, paddingHorizontal: 0, marginBottom: 20 }]}>{this.state.type ? 'Everyone can access this channel' : 'Just invited people can access this channel'}</Text>
						<TouchableOpacity onPress={() => this.submit()} style={[styles.buttonContainer_white, { backgroundColor: (this.state.channelName.length === 0 || this.props.result.isFetching) ? '#e1e5e8' : '#1d74f5' }]}>
							<Text style={styles.button_white}> { this.props.result.isFetching ? 'LOADING' : 'CREATE' }!</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardView>
		);
	}
}
