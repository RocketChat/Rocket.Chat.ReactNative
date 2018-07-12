import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { responsive } from 'react-native-responsive-ui';

import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import I18n from '../../i18n';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		width: '100%',
		maxHeight: 246
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

@responsive
export default class UploadProgress extends Component {
	static propTypes = {
		window: PropTypes.object,
		rid: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			uploads: []
		};
		this.uploads = database.objects('uploads').filtered('rid = $0', this.props.rid);
		this.uploads.addListener(this.updateUploads);
	}

	componentDidMount() {
		this.uploads.forEach((u) => {
			if (!RocketChat.isUploadActive(u.path)) {
				database.write(() => {
					const [upload] = database.objects('uploads').filtered('path = $0', u.path);
					if (upload) {
						upload.error = true;
					}
				});
			}
		});
	}

	componentWillUnmount() {
		this.uploads.removeAllListeners();
	}

	deleteUpload = (item) => {
		database.write(() => database.delete(item));
	}

	cancelUpload = async(item) => {
		try {
			await RocketChat.cancelUpload(item.path);
		} catch (e) {
			log('UploadProgess.cancelUpload', e);
		}
	}

	tryAgain = async(item) => {
		try {
			database.write(() => {
				item.error = false;
			});
			await RocketChat.sendFileMessage(this.props.rid, JSON.parse(JSON.stringify(item)));
		} catch (e) {
			log('UploadProgess.tryAgain', e);
		}
	}

	updateUploads = () => {
		this.setState({ uploads: this.uploads });
	}

	renderItemContent = (item) => {
		if (!item.error) {
			return (
				[
					<View key='row' style={styles.row}>
						<Icon name='image' size={20} color='#9EA2A8' />
						<Text style={[styles.descriptionContainer, styles.descriptionText]} ellipsizeMode='tail' numberOfLines={1}>
							{I18n.t('Uploading')} {item.name}
						</Text>
						<Icon name='close' size={20} color='#9EA2A8' onPress={() => this.cancelUpload(item)} />
					</View>,
					<View key='progress' style={[styles.progress, { width: (this.props.window.width * item.progress) / 100 }]} />
				]
			);
		}
		return (
			<View style={styles.row}>
				<Icon name='warning' size={20} color='#FF5050' />
				<View style={styles.descriptionContainer}>
					<Text style={styles.descriptionText}>{I18n.t('Error_uploading')} {item.name}</Text>
					<TouchableOpacity onPress={() => this.tryAgain(item)}>
						<Text style={styles.tryAgainButtonText}>{I18n.t('Try_again')}</Text>
					</TouchableOpacity>
				</View>
				<Icon name='close' size={20} color='#9EA2A8' onPress={() => this.deleteUpload(item)} />
			</View>
		);
	}

	renderItem = (item, index) => (
		<View key={item.path} style={[styles.item, index !== 0 ? { marginTop: 10 } : {}]}>
			{this.renderItemContent(item)}
		</View>
	);

	render() {
		const { uploads } = this.state;
		return (
			<ScrollView style={styles.container}>
				{uploads.map((item, i) => this.renderItem(item, i))}
			</ScrollView>
		);
	}
}
