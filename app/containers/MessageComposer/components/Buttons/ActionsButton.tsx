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
import { Platform, PermissionsAndroid, InteractionManager } from 'react-native';
import { showErrorAlert } from '../../../../lib/methods/helpers';
import { getCurrentPositionOnce } from '../../../../views/LocationShare/services/staticLocation';
import { MapProviderName } from '../../../../views/LocationShare/services/mapProviders';

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
		console.log('openCurrentPreview called with provider:', provider);

		try {
			if (!rid) {
				console.log('Error: rid is missing');
				showErrorAlert(I18n.t('Room_not_available'), I18n.t('Oops'));
				return;
			}

			console.log('rid exists:', rid);

			// Remove the manual Android permission check since getCurrentPositionOnce() handles it
			console.log('Getting current position...');
			const coords = await getCurrentPositionOnce();
			console.log('Got coordinates:', coords);

			const params = {
				rid,
				tmid,
				provider,
				coords,
				googleKey: provider === 'google' ? 'AIzaSyBeNJSMCi8kD4c6SOvZ4vxHnWYp2yzDbmg' : undefined,
				osmKey: provider === 'osm' ? 'pk.898e468814facdcffda869b42260a2f0' : undefined
			};

			console.log('Navigation params:', params);
			console.log('isMasterDetail:', isMasterDetail);

			// Defer navigation until after animations are done
			InteractionManager.runAfterInteractions(() => {
				console.log('Starting navigation...');
				if (isMasterDetail) {
					// @ts-ignore
					Navigation.navigate('ModalStackNavigator', { screen: 'LocationPreviewModal', params });
				} else {
					// @ts-ignore
					Navigation.navigate('LocationPreviewModal', params);
				}
				console.log('Navigation called');
			});
		} catch (e: any) {
			console.error('openCurrentPreview error:', e);
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
				const providerOptions: TActionSheetOptionsItem[] = [
					{
						title: 'OpenStreetMap',
						icon: 'pin-map',
						onPress: () => openSheetSafely(() => openModeSheetForProvider('osm'))
					},
					{
						title: 'Google Maps',
						icon: 'pin-map',
						onPress: () => openSheetSafely(() => openModeSheetForProvider('google'))
					}
				];

				openSheetSafely(() => {
					showActionSheet({ options: providerOptions });
				});
			}
		});

		closeEmojiKeyboardAndAction(showActionSheet, { options });
	};

	return <BaseButton onPress={onPress} testID='message-composer-actions' accessibilityLabel='Actions' icon='add' />;
};
