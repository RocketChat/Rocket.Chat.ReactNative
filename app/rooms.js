import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import realm from './realm';


const styles = StyleSheet.create({
	roomItem: {
		lineHeight: 18,
		borderTopWidth: 2,
		borderColor: '#aaa',
		padding: 14
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
		onPressItem: PropTypes.func.isRequired,
		title: PropTypes.string.isRequired,
		id: PropTypes.string.isRequired
	}

	_onPress = () => {
		this.props.onPressItem(this.props.id);
	};

	render() {
		return (
			<Text onPress={this._onPress} style={styles.roomItem}>{ this.props.title }</Text>
		);
	}
}

export default class RoomsView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);

		const getState = () => ({
			selected: new Map(),
			dataSource: realm.objects('subscriptions')
		});

		realm.addListener('change', () => this.setState(getState()));

		this.state = getState();
	}

	_onPressItem = (id) => {
		const { navigate } = this.props.navigation;
		console.log('pressed', id);
		navigate('Room', { sid: id });
	}

	renderItem = ({ item }) => (
		<RoomItem
			id={item._id}
			onPressItem={this._onPressItem}
			title={item.name}
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
