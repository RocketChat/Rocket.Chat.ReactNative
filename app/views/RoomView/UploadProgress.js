import React, { Component } from 'react';
import {
	View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import PropTypes from 'prop-types';
import { responsive } from 'react-native-responsive-ui';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
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

class UploadProgress extends Component {
	static propTypes = {
		window: PropTypes.object,
		rid: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		baseUrl: PropTypes.string.isRequired
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		this.ranInitialUploadCheck = false;
		this.state = {
			uploads: []
		};
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
	}

	componentWillUnmount() {
		if (this.uploadsSubscription && this.uploadsSubscription.unsubscribe) {
			this.uploadsSubscription.unsubscribe();
		}
	}

	init = () => {
		const { rid } = this.props;

		const db = database.active;
		this.uploadsObservable = db.collections
			.get('uploads')
			.query(
				Q.where('rid', rid)
			)
			.observeWithColumns(['progress', 'error']);

		this.uploadsSubscription = this.uploadsObservable
			.subscribe((uploads) => {
				if (this.mounted) {
					this.setState({ uploads });
				} else {
					this.state.uploads = uploads;
				}
				if (!this.ranInitialUploadCheck) {
					this.uploadCheck();
				}
			});
	}

	uploadCheck = () => {
		this.ranInitialUploadCheck = true;
		const { uploads } = this.state;
		uploads.forEach(async(u) => {
			if (!RocketChat.isUploadActive(u.path)) {
				try {
					const db = database.active;
					await db.action(async() => {
						await u.update(() => {
							u.error = true;
						});
					});
				} catch (e) {
					log(e);
				}
			}
		});
	}

	deleteUpload = async(item) => {
		try {
			const db = database.active;
			await db.action(async() => {
				await item.destroyPermanently();
			});
		} catch (e) {
			log(e);
		}
	}

	cancelUpload = async(item) => {
		try {
			await RocketChat.cancelUpload(item);
		} catch (e) {
			log(e);
		}
	}

	tryAgain = async(item) => {
		const { rid, baseUrl: server, user } = this.props;

		try {
			const db = database.active;
			await db.action(async() => {
				await item.update(() => {
					item.error = false;
				});
			});
			await RocketChat.sendFileMessage(rid, item, undefined, server, user);
		} catch (e) {
			log(e);
		}
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

	// TODO: transform into stateless and update based on its own observable changes
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

export default responsive(UploadProgress);
