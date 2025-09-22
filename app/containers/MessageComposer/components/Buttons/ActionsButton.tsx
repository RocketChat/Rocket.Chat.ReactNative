import React, { useContext } from 'react';

import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { BaseButton } from './BaseButton';
import { TActionSheetOptionsItem, useActionSheet } from '../../../ActionSheet';
import { MessageInnerContext } from '../../context';
import I18n from '../../../../i18n';
import Navigation from '../../../../lib/navigation/appNavigation';
import { useAppSelector, usePermissions } from '../../../../lib/hooks';
import { useCanUploadFile, useChooseMedia } from '../../hooks';
import { useRoomContext } from '../../../../views/RoomView/context';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { showErrorAlert } from '../../../../lib/methods/helpers';
import { getCurrentPositionOnce } from '../../../../views/LocationShare/services/staticLocation';
import { MapProviderName } from '../../../../views/LocationShare/services/mapProviders';
import { isLiveLocationActive, reopenLiveLocationModal } from '../../../../views/LocationShare/LiveLocationPreviewModal';

export const ActionsButton = () => {
	const { rid, tmid, t } = useRoomContext();
	const { closeEmojiKeyboardAndAction } = useContext(MessageInnerContext);
	const permissionToUpload = useCanUploadFile(rid);
	const [permissionToViewCannedResponses] = usePermissions(['view-canned-responses'], rid);
	const { takePhoto, takeVideo, chooseFromLibrary, chooseFile } = useChooseMedia({
		rid,
		tmid,
		permissionToUpload
	});
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const createDiscussion = async () => {
		if (!rid) return;
		const subscription = await getSubscriptionByRoomId(rid);
		const params = { channel: subscription, showCloseModal: true };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'CreateDiscussionView', params });
		} else {
			Navigation.navigate('NewMessageStackNavigator', { screen: 'CreateDiscussionView', params });
		}
	};

	const openCurrentPreview = async (provider: MapProviderName) => {
		try {
			if (!rid) {
				showErrorAlert(I18n.t('Room_not_available'), I18n.t('Oops'));
				return;
			}
			if (Platform.OS === 'android') {
				const res = await PermissionsAndroid.requestMultiple([
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
					PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
				]);
				const fine = res[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
				const coarse = res[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];
				if (fine !== PermissionsAndroid.RESULTS.GRANTED && coarse !== PermissionsAndroid.RESULTS.GRANTED) {
					throw new Error(I18n.t('Permission_denied'));
				}
			}

			const preview = await getCurrentPositionOnce();

			const params = {
				rid,
				tmid,
				provider,
				coords: preview,
				googleKey: provider === 'google' ? 'AIzaSyBeNJSMCi8kD4c6SOvZ4vxHnWYp2yzDbmg' : undefined,
				osmKey: provider === 'osm' ? 'pk.898e468814facdcffda869b42260a2f0' : undefined // <-- Mapbox-style key
			};
			if (isMasterDetail) {
				// @ts-ignore
				Navigation.navigate('ModalStackNavigator', { screen: 'LocationPreviewModal', params });
			} else {
				// @ts-ignore
				// Navigation.navigate('LocationPreviewModal', { rid, tmid, provider, coords: fix, googleKey: undefined });
				Navigation.navigate('LocationPreviewModal', params);
			}
		} catch (e: any) {
			showErrorAlert(e?.message || I18n.t('Could_not_get_location'), I18n.t('Oops'));
		}
	};

	const openLivePreview = async (provider: MapProviderName) => {
		try {
			if (!rid) {
				showErrorAlert(I18n.t('Room_not_available'), I18n.t('Oops'));
				return;
			}
			if (Platform.OS === 'android') {
				const res = await PermissionsAndroid.requestMultiple([
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
					PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
				]);
				const fine = res[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
				const coarse = res[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];
				if (fine !== PermissionsAndroid.RESULTS.GRANTED && coarse !== PermissionsAndroid.RESULTS.GRANTED) {
					throw new Error(I18n.t('Permission_denied'));
				}
			}

			const params = {
				rid,
				tmid,
				provider,
				googleKey: provider === 'google' ? 'AIzaSyBeNJSMCi8kD4c6SOvZ4vxHnWYp2yzDbmg' : undefined,
				osmKey: provider === 'osm' ? 'pk.898e468814facdcffda869b42260a2f0' : undefined
			};

			if (isMasterDetail) {
				// @ts-ignore
				Navigation.navigate('ModalStackNavigator', { screen: 'LiveLocationPreviewModal', params });
			} else {
				// @ts-ignore
				Navigation.navigate('LiveLocationPreviewModal', params);
			}
		} catch (e: any) {
			showErrorAlert(e?.message || I18n.t('Could_not_get_location'), I18n.t('Oops'));
		}
	};

	const openModeSheetForProvider = (provider: MapProviderName) => {
		const modeOptions: TActionSheetOptionsItem[] = [
			{
				title: I18n.t('Share_current_location'),
				icon: 'pin-map',
				onPress: () => {
					hideActionSheet();
					setTimeout(() => openCurrentPreview(provider), 250);
				}
			},
			{
				title: I18n.t('Start_live_location'),
				icon: 'live',
				onPress: () => {
					hideActionSheet();
					setTimeout(() => openLivePreview(provider), 250);
				}
			}
		];
		showActionSheet({ options: modeOptions });
	};

	const onPress = () => {
		const options: TActionSheetOptionsItem[] = [];
		if (t === 'l' && permissionToViewCannedResponses) {
			options.push({
				title: I18n.t('Canned_Responses'),
				icon: 'canned-response',
				onPress: () => Navigation.navigate('CannedResponsesListView', { rid })
			});
		}
		if (permissionToUpload) {
			options.push(
				{
					title: I18n.t('Take_a_photo'),
					icon: 'camera-photo',
					onPress: () => {
						hideActionSheet();
						// This is necessary because the action sheet does not close properly on Android
						setTimeout(() => {
							takePhoto();
						}, 250);
					}
				},
				{
					title: I18n.t('Take_a_video'),
					icon: 'camera',
					onPress: () => {
						hideActionSheet();
						// This is necessary because the action sheet does not close properly on Android
						setTimeout(() => {
							takeVideo();
						}, 250);
					}
				},
				{
					title: I18n.t('Choose_from_library'),
					icon: 'image',
					onPress: () => {
						hideActionSheet();
						// This is necessary because the action sheet does not close properly on Android
						setTimeout(() => {
							chooseFromLibrary();
						}, 250);
					}
				},
				{
					title: I18n.t('Choose_file'),
					icon: 'attach',
					onPress: () => chooseFile()
				}
			);
		}

		options.push({
			title: I18n.t('Create_Discussion'),
			icon: 'discussions',
			onPress: () => createDiscussion()
		});

		options.push({
			title: I18n.t('Share_Location'),
			icon: 'pin-map',
			onPress: () => {
				const providerOptions: TActionSheetOptionsItem[] = [
					{
						title: 'OpenStreetMap',
						icon: 'pin-map',
						onPress: () => {
							hideActionSheet();
							setTimeout(() => openModeSheetForProvider('osm'), 250);
						}
					},
					{
						title: 'Google Maps',
						icon: 'pin-map',
						onPress: () => {
							hideActionSheet();
							setTimeout(() => openModeSheetForProvider('google'), 250);
						}
					}
				];
				hideActionSheet();
				setTimeout(() => showActionSheet({ options: providerOptions }), 250);
			}
		});

		closeEmojiKeyboardAndAction(showActionSheet, { options });
	};

	return <BaseButton onPress={onPress} testID='message-composer-actions' accessibilityLabel='Actions' icon='add' />;
};
