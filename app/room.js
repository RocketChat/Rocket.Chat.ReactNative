import React from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import realm from './realm';
import { loadMessagesForRoom } from './meteor';
import Markdown from 'react-native-simple-markdown';


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
	_onPress = () => {
		this.props.onPressItem(this.props.id);
	};

	render() {
		return (
			<View style={styles.roomItem}>
				<Image style={styles.avatar} source={{uri: `http://localhost:3000/avatar/${ this.props.item.u.username }`}}>
				</Image>
				<View>
					<Text onPress={this._onPress} style={styles.username}>
						{this.props.item.u.username}
					</Text>
					<Markdown whitelist={['link', 'url']}>
						{this.props.item.msg}
					</Markdown>
				</View>
			</View>
		);
	}
}

export class RoomView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: realm.objectForPrimaryKey('subscriptions', navigation.state.params.sid).name
		// title: navigation.state.params.rid
	});

	_onPressItem(id) {
		console.log('pressed', id);
	}

	renderItem = ({item}) => (
		<RoomItem
			id={item._id}
			onPressItem={this._onPressItem}
			selected={true}
			item={item}
		/>
	);

	constructor(props) {
		super(props);
		this.rid = realm.objectForPrimaryKey('subscriptions', props.navigation.state.params.sid).rid;
		// this.rid = 'GENERAL';

		loadMessagesForRoom(this.rid);

		const getState = () => {
			return {
				selected: new Map(),
				dataSource: realm.objects('messages').filtered('rid = $0', this.rid)
			};
		};

		realm.addListener('change', () => this.setState(getState()));

		this.state = getState();
	}

	renderSeparator = () => {
		return (
			<View style={styles.separator} />
		);
	};


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
