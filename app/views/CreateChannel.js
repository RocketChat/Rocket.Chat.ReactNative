import ActionButton from 'react-native-action-button';
import Icon from 'react-native-vector-icons/Ionicons';
import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, StyleSheet, View, Text, Switch } from 'react-native';
import RocketChat from '../lib/rocketchat';

// import KeyboardView from '../components/KeyboardView';

const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'column',
		padding: 24
	},
	input: {
		// height: 50,
		fontSize: 20,
		borderColor: '#ffffff',
		padding: 5,
		borderWidth: 0,
		backgroundColor: 'white'
	},
	field: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	field_label: {
		flexGrow: 1
	},
	field_input: {
		flexGrow: 1,
		fontSize: 20,
		borderColor: '#ffffff',
		padding: 5,
		borderWidth: 0,
		backgroundColor: 'white'
	},
	actionButtonIcon: {
		fontSize: 20,
		height: 22,
		color: 'white'
	}
});
const mainIcon = <Icon name='md-checkmark' style={styles.actionButtonIcon} />;
export default class CreateChannelView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	static navigationOptions = () => ({
		title: 'Create Channel'
	});

	constructor(props) {
		super(props);

		this.state = {
			channelName: '',
			type: true
		};
	}
	submit() {
		const { channelName, users = [], type = true } = this.state;
		RocketChat.createChannel({ name: channelName, users, type }).then(res => Promise.reject(res));

		// 	{ username: this.state.username }, this.state.password, () => {
		// 	this.props.navigation.dispatch({ type: 'Navigation/BACK' });
		// });
	}

	render() {
		return (
			<View style={styles.view}>
				<View style={styles.field}>
					<TextInput
						style={styles.field_input}
						onChangeText={channelName => this.setState({ channelName })}
						autoCorrect={false}
						returnKeyType='done'
						autoCapitalize='none'
						autoFocus
						// onSubmitEditing={() => this.textInput.focus()}
						placeholder='Type the channel name here'
					/>
				</View>
				<View style={styles.field}>
					<Text style={styles.field_label}>{this.state.type ? 'Public' : 'Private'}</Text>
					<Switch
						style={styles.field_input}
						value={this.state.type}
						onValueChange={type => this.setState({ type })}
					/>
				</View>
				{this.state.channelName.length > 0 ?
					<ActionButton buttonColor='green' icon={mainIcon} onPress={() => this.submit()} /> : null }
			</View>
		);
	}
}
