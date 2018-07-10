import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { responsive } from 'react-native-responsive-ui';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		width: '100%'
	},
	item: {
		backgroundColor: '#F1F2F4',
		height: 54,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: '#CACED1',
		justifyContent: 'center',
		paddingHorizontal: 20
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	descriptionContainer: {
		flexDirection: 'column',
		flex: 1,
		marginLeft: 10
	},
	descriptionText: {
		fontSize: 16,
		lineHeight: 20,
		color: '#54585E'
	},
	progress: {
		position: 'absolute',
		bottom: 0,
		backgroundColor: '#1D74F5',
		height: 3
	},
	tryAgainButtonText: {
		color: '#1D74F5',
		fontSize: 16,
		fontWeight: '500',
		lineHeight: 20
	}
});

const Item = ({ item, i, width }) => {
	if (item === 'uploading') {
		return (
			<View style={[styles.item, i !== 0 ? { marginTop: 10 } : {}]}>
				<View style={styles.row}>
					<Icon name='image' size={20} color='#9EA2A8' />
					<Text style={[styles.descriptionContainer, styles.descriptionText]} ellipsizeMode='tail' numberOfLines={1}>
						Uploading layout.png
					</Text>
					<Icon name='close' size={20} color='#9EA2A8' onPress={() => {}} />
				</View>
				<View style={[styles.progress, { width: (width * 50) / 100 }]} />
			</View>
		);
	}
	return (
		<View style={[styles.item, i !== 0 ? { marginTop: 10 } : {}]}>
			<View style={styles.row}>
				<Icon name='warning' size={20} color='#FF5050' />
				<View style={styles.descriptionContainer}>
					<Text style={styles.descriptionText}>Error to upload image</Text>
					<TouchableOpacity>
						<Text style={styles.tryAgainButtonText}>Try again</Text>
					</TouchableOpacity>
				</View>
				<Icon name='close' size={20} color='#9EA2A8' onPress={() => {}} />
			</View>
		</View>
	);
};

const items = ['uploading', 'error'];

@responsive
export default class UploadProgress extends Component {
	static propTypes = {
		window: PropTypes.object
	}

	render() {
		return (
			<View style={styles.container}>
				{items.map((item, i) => <Item key={item} item={item} i={i} width={this.props.window.width} />)}
			</View>
		);
	}
}
