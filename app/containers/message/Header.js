import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome';
import Avatar from '../Avatar';
import styles from './styles';

@connect(state => ({
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod
}))
export default class User extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		onPress: PropTypes.func
	}

	render() {
		const { item, previousItem } = this.props;
		// if (previousItem && (
		// 	(previousItem.u.username === item.u.username) &&
		// 		(previousItem.groupable === false || item.groupable === false) &&
		// 		(item.ts - previousItem.ts > this.props.Message_GroupingPeriod * 1000)
		// )) {
		// 	return null;
		// }
		return (
			<View style={styles.flex}>
				<Avatar
					style={styles.avatar}
					text={item.username}
					size={50}
					avatar={item.avatar}
				/>
				<User
					onPress={this._onPress}
					item={item}
					Message_TimeFormat={this.timeFormat}
				/>
			</View>
		);
	}
}
