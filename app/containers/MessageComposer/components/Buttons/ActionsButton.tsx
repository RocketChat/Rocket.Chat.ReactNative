import React, { useContext } from 'react';
import { Platform, PermissionsAndroid, InteractionManager } from 'react-native';
import * as Location from 'expo-location';

import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { BaseButton } from './BaseButton';
import { type TActionSheetOptionsItem, useActionSheet } from '../../../ActionSheet';
import { MessageInnerContext } from '../../context';
import I18n from '../../../../i18n';
import Navigation from '../../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { usePermissions } from '../../../../lib/hooks/usePermissions';
import { useCanUploadFile, useChooseMedia } from '../../hooks';
import { useRoomContext } from '../../../../views/RoomView/context';
import { showErrorAlert } from '../../../../lib/methods/helpers';
import { getCurrentPositionOnce } from '../../../../views/LocationShare/services/staticLocation';
import type { MapProviderName } from '../../../../views/LocationShare/services/mapProviders';
import { useUserPreferences } from '../../../../lib/methods/userPreferences';
import {
	MAP_PROVIDER_PREFERENCE_KEY,
	MAP_PROVIDER_DEFAULT
} from '../../../../lib/constants/keys';

export const ActionsButton = () => {
	// no-op

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
	const userId = useAppSelector(state => state.login.user.id);

	const [mapProvider] = useUserPreferences<MapProviderName>(`${MAP_PROVIDER_PREFERENCE_KEY}_${userId}`, MAP_PROVIDER_DEFAULT);

	// --- Sheet transition helpers ---
	const sheetBusyRef = React.useRef(false);
	/** Safely close the current ActionSheet and then run `fn` (open next sheet) */
	const openSheetSafely = (fn: () => void, delayMs = 350) => {
		if (sheetBusyRef.current) return;
		sheetBusyRef.current = true;

		hideActionSheet();
		InteractionManager.runAfterInteractions(() => {
			setTimeout(() => {
				try {
					fn();
				} finally {
					sheetBusyRef.current = false;
				}
			}, delayMs);
		});
	};

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
				const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
				if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
					showErrorAlert(I18n.t('Location_permission_required'), I18n.t('Oops'));
					return;
				}
			} else {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') {
					showErrorAlert(I18n.t('Location_permission_required'), I18n.t('Oops'));
					return;
				}
			}

			const coords = await getCurrentPositionOnce();

			const params = {
				rid,
				tmid,
				provider,
				coords
			};

			InteractionManager.runAfterInteractions(() => {
				if (isMasterDetail) {
					Navigation.navigate('ModalStackNavigator', { screen: 'LocationPreviewModal', params });
				} else {
					Navigation.navigate('LocationPreviewModal', params);
				}
			});
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
			} else {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') {
					throw new Error(I18n.t('Location_permission_required'));
				}
			}

			const params = {
				rid,
				tmid,
				provider
			};

			// Defer navigation until after sheets/animations are done
			InteractionManager.runAfterInteractions(() => {
				// @ts-ignore
				if (isMasterDetail) {
					Navigation.navigate('ModalStackNavigator', { screen: 'LiveLocationPreviewModal', params });
				} else {
					Navigation.navigate('LiveLocationPreviewModal', params);
				}
			});
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
					// sheet -> navigation: close current sheet safely, then start flow
					openSheetSafely(() => openCurrentPreview(provider));
				}
			},
			{
				title: I18n.t('Start_live_location'),
				icon: 'live',
				onPress: () => {
					// sheet -> navigation: close current sheet safely, then start flow
					openSheetSafely(() => openLivePreview(provider));
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
				onPress: () => {
					hideActionSheet();
					InteractionManager.runAfterInteractions(() => {
						Navigation.navigate('CannedResponsesListView', { rid });
					});
				}
			});
		}

		if (permissionToUpload) {
			options.push(
				{
					title: I18n.t('Take_a_photo'),
					icon: 'camera-photo',
					onPress: () => {
						hideActionSheet();
						InteractionManager.runAfterInteractions(() => {
							takePhoto();
						});
					}
				},
				{
					title: I18n.t('Take_a_video'),
					icon: 'camera',
					onPress: () => {
						hideActionSheet();
						InteractionManager.runAfterInteractions(() => {
							takeVideo();
						});
					}
				},
				{
					title: I18n.t('Choose_from_library'),
					icon: 'image',
					onPress: () => {
						hideActionSheet();
						InteractionManager.runAfterInteractions(() => {
							chooseFromLibrary();
						});
					}
				},
				{
					title: I18n.t('Choose_file'),
					icon: 'attach',
					onPress: () => {
						hideActionSheet();
						InteractionManager.runAfterInteractions(() => {
							chooseFile();
						});
					}
				}
			);
		}

		options.push({
			title: I18n.t('Create_Discussion'),
			icon: 'discussions',
			onPress: () => {
				hideActionSheet();
				InteractionManager.runAfterInteractions(() => {
					createDiscussion();
				});
			}
		});

		options.push({
			title: I18n.t('Share_Location'),
			icon: 'pin-map',
			onPress: () => {
				openSheetSafely(() => openModeSheetForProvider(mapProvider));
			}
		});

		closeEmojiKeyboardAndAction(showActionSheet, { options });
	};

	return <BaseButton onPress={onPress} testID='message-composer-actions' accessibilityLabel='Actions' icon='add' />;
};
