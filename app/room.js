import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
// import Markdown from 'react-native-simple-markdown';
import realm from './realm';
import { loadMessagesForRoom } from './meteor';


const styles = StyleSheet.create({
	roomItem: {
		borderColor: '#aaa',
		padding: 14,
		flexDirection: 'row'
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
	container: {
		flex: 1
	},
	separator: {
		height: 1,
		// width: "86%",
		backgroundColor: '#CED0CE'
		// marginLeft: "14%"
	}
});

class RoomItem extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired
	}

	render() {
		return (
			<View style={styles.roomItem}>
				<Image style={styles.avatar} source={{ uri: `http://localhost:3000/avatar/${ this.props.item.u.username }` }} />
				<View>
					<Text onPress={this._onPress} style={styles.username}>
						{this.props.item.u.username}
					</Text>
					<Text>
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

		loadMessagesForRoom(this.rid);

		const getState = () => ({
			selected: new Map(),
			dataSource: realm.objects('messages').filtered('rid = $0', this.rid)
		});

		realm.addListener('change', () => this.setState(getState()));

		this.state = getState();
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

	render() {
		return (
			<View style={styles.container}>
				<FlatList
					style={styles.list}
					data={this.state.dataSource}
					renderItem={this.renderItem}
					keyExtractor={item => item._id}
					ItemSeparatorComponent={this.renderSeparator}
				/>
			</View>
		);
	}
}
