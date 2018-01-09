import React from 'react';
import PropTypes from 'prop-types';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';
import styles from './styles';

@connect(state => ({
	loading: state.messages.isFetching
}), null)
export default class Banner extends React.PureComponent {
	static propTypes = {
		loading: PropTypes.bool
	};

	render() {
		return (this.props.loading ? (
			<View style={styles.bannerContainer}>
				<Text style={styles.bannerText}>Loading new messages...</Text>
			</View>
		) : null);
	}
}
