import React from 'react';
import PropTypes from 'prop-types';
import { View, Platform, FlatList, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import { openStarredMessages, closeStarredMessages } from '../../actions/starredMessages';
import styles from './styles';

@connect(
	null,
	dispatch => ({
		openStarredMessages: rid => dispatch(openStarredMessages(rid)),
		closeStarredMessages: () => dispatch(closeStarredMessages())
	})
)
export default class StarredMessagesView extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object,
		openStarredMessages: PropTypes.func,
		closeStarredMessages: PropTypes.func
	}

	componentWillMount() {
		this.props.openStarredMessages(this.props.navigation.state.params.rid);
	}

	componentWillUnmount() {
		this.props.closeStarredMessages();
	}

	renderItem = ({ item }) => <Text>{item.key}</Text>

	render() {
		return (
			<FlatList
				data={[{key: 'a'}, {key: 'b'}]}
				renderItem={this.renderItem}
			/>
		);
	}
}
