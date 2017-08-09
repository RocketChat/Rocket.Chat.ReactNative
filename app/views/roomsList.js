import React from 'react';
import PropTypes from 'prop-types';
import { View, FlatList, StyleSheet } from 'react-native';
import realm from '../lib/realm';

import RoomItem from '../components/RoomItem';

const styles = StyleSheet.create({
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

export default class RoomsListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);

		this.state = {
			dataSource: realm.objects('subscriptions').sorted('name')
		};
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
