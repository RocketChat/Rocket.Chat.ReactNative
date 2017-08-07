import React from 'react';
import PropTypes from 'prop-types';
import { View, KeyboardAvoidingView, Text, TextInput, FlatList, StyleSheet, Image } from 'react-native';
// import Markdown from 'react-native-simple-markdown';
import realm from './realm';
import { loadMessagesForRoom, sendMessage } from './meteor';


const styles = StyleSheet.create({
	roomItem: {
		borderColor: '#aaa',
		padding: 14,
		flexDirection: 'row',
		transform: [{ scaleY: -1 }]
	},
	avatar: {
		backgroundColor: '#ccc',
		width: 40,
		height: 40,
		marginRight: 10,
		borderRadius: 5
	},
	username: {
		fontWeight: 'bold',
		marginBottom: 5
	},
	texts: {
		flex: 1
	},
	msg: {
		flex: 1
	},
	container: {
		flex: 1
	},
	list: {
		flex: 1,
		transform: [{ scaleY: -1 }]
	},
	separator: {
		height: 1,
		// width: "86%",
		backgroundColor: '#CED0CE'
		// marginLeft: "14%"
	},
	textBox: {
		paddingTop: 1,
		backgroundColor: '#ccc'
	},
	textBoxInput: {
		height: 40,
		backgroundColor: '#fff',
		paddingLeft: 15
	}
});

class RoomItem extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired
	}

	render() {
		const extraStyle = {};
		if (this.props.item.temp) {
			extraStyle.opacity = .3;
		}

		return (
			<View style={[styles.roomItem, extraStyle]}>
				<Image style={styles.avatar} source={{ uri: `http://localhost:3000/avatar/${ this.props.item.u.username }` }} />
				<View style={styles.texts}>
					<Text onPress={this._onPress} style={styles.username}>
						{this.props.item.u.username}
					</Text>
					<Text style={styles.msg}>
						{this.props.item.msg}
					</Text>
					{/* <Markdown whitelist={['link', 'url']}>
						{this.props.item.msg}
					</Markdown> */}
				</View>
			</View>
		);
	}
}

export default class RoomView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	static navigationOptions = ({ navigation }) => ({
		title: realm.objectForPrimaryKey('subscriptions', navigation.state.params.sid).name
	});

	constructor(props) {
		super(props);
		this.rid = realm.objectForPrimaryKey('subscriptions', props.navigation.state.params.sid).rid;
		// this.rid = 'GENERAL';

		this.state = this.getState();

		loadMessagesForRoom(this.rid);

		this.state = this.getState();
	}

	getState = () => ({
		...this.state,
		dataSource: realm.objects('messages').filtered('rid = $0', this.rid).sorted('ts', true)
	});

	updateState = () => (this.setState(this.getState()))

	componentDidMount() {
		realm.addListener('change', this.updateState);
	}

	componentWillUnmount() {
		realm.removeListener('change', this.updateState);
	}

	renderItem = ({ item }) => (
		<RoomItem
			id={item._id}
			item={item}
		/>
	);

	renderSeparator = () => (
		<View style={styles.separator} />
	);

	submit = () => {
		console.log(this.state.text);
		if (this.state.text.trim() === '') {
			return;
		}

		sendMessage(this.rid, this.state.text);

		this.setState({
			...this.state,
			text: ''
		});
	}

	render() {
		return (
			<KeyboardAvoidingView style={styles.container}>
				<FlatList
					ref={ref => this.listView = ref}
					style={styles.list}
					data={this.state.dataSource}
					extraData={this.state}
					renderItem={this.renderItem}
					keyExtractor={item => item._id}
					ItemSeparatorComponent={this.renderSeparator}
				/>
				<View style={styles.textBox}>
					<TextInput
						style={styles.textBoxInput}
						value={this.state.text}
						onChangeText={text => this.setState({ text })}
						returnKeyType='send'
						onSubmitEditing={this.submit}
						autoFocus
						placeholder='New message'
					></TextInput>
				</View>
			</KeyboardAvoidingView>
		);
	}
}
