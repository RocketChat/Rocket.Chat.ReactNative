import React, { Component } from 'react';
import {
	View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import PropTypes from 'prop-types';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';

import database, { safeAddListener } from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import {
	COLOR_SEPARATOR, COLOR_PRIMARY, COLOR_BACKGROUND_CONTAINER, COLOR_TEXT_DESCRIPTION, COLOR_DANGER
} from '../../constants/colors';
import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		width: '100%',
		maxHeight: 246
	},
	item: {
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		height: 54,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR,
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
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	progress: {
		position: 'absolute',
		bottom: 0,
		backgroundColor: COLOR_PRIMARY,
		height: 3
	},
	tryAgainButtonText: {
		color: COLOR_PRIMARY,
		fontSize: 16,
		lineHeight: 20,
		...sharedStyles.textMedium
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
		const { rid } = this.props;
		this.uploads = database.objects('uploads').filtered('rid = $0', rid);
		safeAddListener(this.uploads, this.updateUploads);
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

	shouldComponentUpdate(nextProps, nextState) {
		const { uploads } = this.state;
		const { window } = this.props;
		if (nextProps.window.width !== window.width) {
			return true;
		}
		if (!equal(nextState.uploads, uploads)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.uploads.removeAllListeners();
	}

	deleteUpload = (item) => {
		const uploadItem = this.uploads.filtered('path = $0', item.path);
		try {
			database.write(() => database.delete(uploadItem[0]));
		} catch (e) {
			log('UploadProgess.deleteUpload', e);
		}
	}

	cancelUpload = async(item) => {
		try {
			await RocketChat.cancelUpload(item.path);
		} catch (e) {
			log('UploadProgess.cancelUpload', e);
		}
	}

	tryAgain = async(item) => {
		const { rid } = this.props;

		try {
			database.write(() => {
				item.error = false;
			});
			await RocketChat.sendFileMessage(rid, item);
		} catch (e) {
			log('UploadProgess.tryAgain', e);
		}
	}

	updateUploads = () => {
		const uploads = this.uploads.map(item => JSON.parse(JSON.stringify(item)));
		this.setState({ uploads });
	}

	renderItemContent = (item) => {
		const { window } = this.props;

		if (!item.error) {
			return (
				[
					<View key='row' style={styles.row}>
						<CustomIcon name='file-generic' size={20} color={COLOR_TEXT_DESCRIPTION} />
						<Text style={[styles.descriptionContainer, styles.descriptionText]} ellipsizeMode='tail' numberOfLines={1}>
							{I18n.t('Uploading')} {item.name}
						</Text>
						<CustomIcon name='cross' size={20} color={COLOR_TEXT_DESCRIPTION} onPress={() => this.cancelUpload(item)} />
					</View>,
					<View key='progress' style={[styles.progress, { width: (window.width * item.progress) / 100 }]} />
				]
			);
		}
		return (
			<View style={styles.row}>
				<CustomIcon name='warning' size={20} color={COLOR_DANGER} />
				<View style={styles.descriptionContainer}>
					<Text style={styles.descriptionText}>{I18n.t('Error_uploading')} {item.name}</Text>
					<TouchableOpacity onPress={() => this.tryAgain(item)}>
						<Text style={styles.tryAgainButtonText}>{I18n.t('Try_again')}</Text>
					</TouchableOpacity>
				</View>
				<CustomIcon name='cross' size={20} color={COLOR_TEXT_DESCRIPTION} onPress={() => this.deleteUpload(item)} />
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
