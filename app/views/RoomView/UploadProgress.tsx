import React, { Component } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { Observable, Subscription } from 'rxjs';

import database from '../../lib/database';
import log from '../../lib/methods/helpers/log';
import I18n from '../../i18n';
import { CustomIcon } from '../../containers/CustomIcon';
import { themes } from '../../lib/constants';
import sharedStyles from '../Styles';
import { TSupportedThemes, withTheme } from '../../theme';
import { TSendFileMessageFileInfo, IUser, TUploadModel } from '../../definitions';
import { sendFileMessage } from '../../lib/methods';
import { cancelUpload, isUploadActive } from '../../lib/methods/sendFileMessage/utils';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		width: '100%',
		maxHeight: 246
	},
	item: {
		height: 54,
		borderBottomWidth: StyleSheet.hairlineWidth,
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
		...sharedStyles.textRegular
	},
	progress: {
		position: 'absolute',
		bottom: 0,
		height: 3
	},
	tryAgainButtonText: {
		fontSize: 16,
		lineHeight: 20,
		...sharedStyles.textMedium
	}
});

interface IUploadProgressProps {
	width: number;
	rid: string;
	user: Pick<IUser, 'id' | 'username' | 'token'>;
	baseUrl: string;
	theme?: TSupportedThemes;
}

interface IUploadProgressState {
	uploads: TUploadModel[];
}

class UploadProgress extends Component<IUploadProgressProps, IUploadProgressState> {
	private mounted = false;
	private ranInitialUploadCheck = false;
	private uploadsObservable?: Observable<TUploadModel[]>;
	private uploadsSubscription?: Subscription;

	constructor(props: IUploadProgressProps) {
		super(props);
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
		if (!rid) {
			return;
		}

		const db = database.active;
		this.uploadsObservable = db.get('uploads').query(Q.where('rid', rid)).observeWithColumns(['progress', 'error']);

		this.uploadsSubscription = this.uploadsObservable.subscribe(uploads => {
			if (this.mounted) {
				this.setState({ uploads });
			} else {
				// @ts-ignore
				this.state.uploads = uploads;
			}
			if (!this.ranInitialUploadCheck) {
				this.uploadCheck();
			}
		});
	};

	uploadCheck = () => {
		this.ranInitialUploadCheck = true;
		const { rid } = this.props;
		const { uploads } = this.state;
		uploads.forEach(async u => {
			if (!isUploadActive(u.path, rid)) {
				try {
					const db = database.active;
					await db.write(async () => {
						await u.update(() => {
							u.error = true;
						});
					});
				} catch (e) {
					log(e);
				}
			}
		});
	};

	deleteUpload = async (item: TUploadModel) => {
		try {
			const db = database.active;
			await db.write(async () => {
				await item.destroyPermanently();
			});
		} catch (e) {
			log(e);
		}
	};

	handleCancelUpload = async (item: TUploadModel) => {
		const { rid } = this.props;
		try {
			await cancelUpload(item, rid);
		} catch (e) {
			log(e);
		}
	};

	tryAgain = async (item: TUploadModel) => {
		const { rid, baseUrl: server, user } = this.props;

		try {
			const db = database.active;
			await db.write(async () => {
				await item.update(() => {
					item.error = false;
				});
			});
			await sendFileMessage(rid, item.asPlain() as TSendFileMessageFileInfo, item.tmid, server, user, true);
		} catch (e) {
			log(e);
		}
	};

	renderItemContent = (item: TUploadModel) => {
		const { width, theme } = this.props;

		if (!item.error) {
			return [
				<View key='row' style={styles.row}>
					<CustomIcon name='attach' size={20} color={themes[theme!].fontSecondaryInfo} />
					<Text
						style={[styles.descriptionContainer, styles.descriptionText, { color: themes[theme!].fontSecondaryInfo }]}
						numberOfLines={1}>
						{I18n.t('Uploading')} {item.name}
					</Text>
					<CustomIcon
						name='close'
						size={20}
						color={themes[theme!].fontSecondaryInfo}
						onPress={() => this.handleCancelUpload(item)}
					/>
				</View>,
				<View
					key='progress'
					style={[
						styles.progress,
						{ width: (width * (item.progress ?? 0)) / 100, backgroundColor: themes[theme!].badgeBackgroundLevel2 }
					]}
				/>
			];
		}
		return (
			<View style={styles.row}>
				<CustomIcon name='warning' size={20} color={themes[theme!].buttonBackgroundDangerDefault} />
				<View style={styles.descriptionContainer}>
					<Text style={[styles.descriptionText, { color: themes[theme!].fontSecondaryInfo }]} numberOfLines={1}>
						{I18n.t('Error_uploading')} {item.name}
					</Text>
					<TouchableOpacity onPress={() => this.tryAgain(item)}>
						<Text style={[styles.tryAgainButtonText, { color: themes[theme!].badgeBackgroundLevel2 }]}>
							{I18n.t('Try_again')}
						</Text>
					</TouchableOpacity>
				</View>
				<CustomIcon name='close' size={20} color={themes[theme!].fontSecondaryInfo} onPress={() => this.deleteUpload(item)} />
			</View>
		);
	};

	// TODO: transform into stateless and update based on its own observable changes
	renderItem = (item: TUploadModel, index: number) => {
		const { theme } = this.props;

		return (
			<View
				key={item.path}
				style={[
					styles.item,
					index !== 0 ? { marginTop: 4 } : {},
					{
						backgroundColor: themes[theme!].surfaceTint,
						borderColor: themes[theme!].strokeLight
					}
				]}>
				{this.renderItemContent(item)}
			</View>
		);
	};

	render() {
		const { uploads } = this.state;
		return <ScrollView style={styles.container}>{uploads.map((item, i) => this.renderItem(item, i))}</ScrollView>;
	}
}

export default withTheme(UploadProgress);
