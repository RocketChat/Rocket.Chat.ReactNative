import React from 'react';
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
	_onPress = () => {
		this.props.onPressItem(this.props.id);
	};

	render() {
		return (
			<Text onPress={this._onPress} style={styles.roomItem}>{this.props.title}</Text>
		);
	}
}

export class RoomsView extends React.Component {
	_onPressItem(id) {
		console.log('pressed', id);
	}

	renderItem = ({item}) => (
		<RoomItem
			id={item._id}
			onPressItem={this._onPressItem}
			selected={true}
			title={item.name}
		/>
	);

	constructor(props) {
		super(props);

		const getState = () => {
			return {
				selected: new Map(),
				dataSource: realm.objects('subscriptions')
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
