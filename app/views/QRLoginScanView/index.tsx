import React, { useEffect, useState, useCallback } from 'react';
import {
	View,
	Text,
	Vibration,
	BackHandler,
	ActivityIndicator
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withRepeat,
	withSequence,
	cancelAnimation
} from 'react-native-reanimated';

import { dynamicStyles } from './styles';
import { CustomIcon } from '../../containers/CustomIcon';
import i18n from '../../i18n';
import { useTheme } from '../../theme';
import { sendScannedQRCode } from '../../lib/services/restApi';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { showErrorAlert } from '../../lib/methods/helpers';

const SCANNER_SIZE = 280;

const QRLoginScanView = ({ navigation }: { navigation?: any }) => {
	const { width: screenWidth, height: screenHeight } = useResponsiveLayout();
	const { colors } = useTheme();
	const [permission, requestPermission] = useCameraPermissions();
	const isFocused = useIsFocused();

	const [flashMode, setFlashMode] = useState(false);
	const [isScanning, setIsScanning] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showCamera, setShowCamera] = useState(false);

	const fadeAnim = useSharedValue(0);
	const scanLineAnim = useSharedValue(0);
	const cornerAnim = useSharedValue(1);

	const styles = dynamicStyles(screenHeight, screenWidth);

	useEffect(() => {
		if (isFocused && permission?.granted) {
			requestAnimationFrame(() => {
				setShowCamera(true);
			});
		} else {
			setShowCamera(false);
		}
	}, [isFocused, permission?.granted]);

	useFocusEffect(
		useCallback(() => {
			setFlashMode(false);
			setIsScanning(true);
			setIsProcessing(false);

			cancelAnimation(fadeAnim);
			cancelAnimation(scanLineAnim);
			cancelAnimation(cornerAnim);

			fadeAnim.value = 0;
			scanLineAnim.value = 0;
			cornerAnim.value = 1;

			fadeAnim.value = withTiming(1, { duration: 300 });

			return () => {
				setShowCamera(false);
				setIsScanning(false);
				setIsProcessing(false);
				cancelAnimation(fadeAnim);
				cancelAnimation(scanLineAnim);
				cancelAnimation(cornerAnim);
			};
		}, [fadeAnim, scanLineAnim, cornerAnim])
	);

	useEffect(() => {
		if (isScanning && showCamera && !isProcessing) {
			scanLineAnim.value = withRepeat(
				withSequence(
					withTiming(1, { duration: 2000 }),
					withTiming(0, { duration: 2000 })
				),
				-1,
				true
			);

			cornerAnim.value = withRepeat(
				withSequence(
					withTiming(0.6, { duration: 1500 }),
					withTiming(1, { duration: 1500 })
				),
				-1,
				true
			);
		} else {
			cancelAnimation(scanLineAnim);
			cancelAnimation(cornerAnim);
		}
	}, [isScanning, showCamera, isProcessing, scanLineAnim, cornerAnim]);

	// eslint-disable-next-line arrow-body-style
	useEffect(() => {
		return () => {
			cancelAnimation(fadeAnim);
			cancelAnimation(scanLineAnim);
			cancelAnimation(cornerAnim);
		};
	}, [fadeAnim, scanLineAnim, cornerAnim]);

	const fadeStyle = useAnimatedStyle(() => ({
		opacity: fadeAnim.value,
		backgroundColor: colors.surfaceRoom
	}));

	const scanLineStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: scanLineAnim.value * (SCANNER_SIZE - 4) }],
		opacity: isScanning && !isProcessing ? 1 : 0,
		backgroundColor: colors.badgeBackgroundLevel4,
		shadowColor: colors.badgeBackgroundLevel3
	}));

	const cornerStyle = useAnimatedStyle(() => ({
		opacity: cornerAnim.value
	}));

	const handleClose = useCallback(() => {
		if (navigation && navigation.goBack) {
			navigation.goBack();
		}
		return true;
	}, [navigation]);

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', handleClose);
		return () => backHandler.remove();
	}, [handleClose]);

	const handleBarcodeScanned = async (scanningResult: BarcodeScanningResult) => {
		if (isProcessing || !isScanning) return;

		setIsScanning(false);
		setIsProcessing(true);

		Vibration?.vibrate?.(100);

		const { data } = scanningResult;

		if (!data?.trim()) {
			setIsProcessing(false);
			showErrorAlert(
				i18n.t('QR_Code_Invalid'),
				i18n.t('Error'),
				() => setIsScanning(true)
			);
			return;
		}

		try {
			const response = await sendScannedQRCode(data);

			if (response.success) {
				setIsProcessing(false);
				if (navigation && navigation.navigate) {
					navigation.navigate('ChatsStackNavigator');
				}
			} else {
				throw new Error(i18n.t('QR_Verification_Error_Description'));
			}
		} catch (error: any) {
			setIsProcessing(false);

			showErrorAlert(
				error?.data?.message || i18n.t('QR_Verification_Error_Description'),
				i18n.t('QR_Verification_Error'),
				() => handleClose()
			);
		}
	};

	const toggleFlash = () => {
		setFlashMode(prev => !prev);
	};

	if (!permission) {
		return (
			<View style={[styles.container, {
				backgroundColor: colors.surfaceRoom,
				justifyContent: 'center',
				alignItems: 'center'
			}]}>
				<Text style={[styles.loadingText, { color: colors.fontTitlesLabels }]}>
					{i18n.t('QR_Loading_Camera')}
				</Text>
			</View>
		);
	}

	if (!permission.granted) {
		return (
			<View style={[styles.container, { backgroundColor: colors.surfaceRoom }]}>
				<View style={styles.permissionContainer}>
					<CustomIcon name='camera' size={64} color={colors.fontTitlesLabels} />
					<Text style={[styles.permissionTitle, { color: colors.fontTitlesLabels }]}>
						{i18n.t('QR_Camera_Permission_Required')}
					</Text>
					<Text style={[styles.permissionText, { color: colors.fontAnnotation }]}>
						{i18n.t('QR_Camera_Permission_Required_Description')}
					</Text>
					<Pressable
						style={[styles.permissionButton, { backgroundColor: colors.badgeBackgroundLevel4 }]}
						onPress={requestPermission}
					>
						<Text style={[styles.permissionButtonText, { color: colors.fontPureBlack }]}>
							{i18n.t('Grant_Permission')}
						</Text>
					</Pressable>
					<Pressable onPress={handleClose}>
						<Text style={[styles.closeButtonText, { color: colors.fontAnnotation }]}>
							{i18n.t('Close')}
						</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	return (
		<Animated.View style={[styles.container, fadeStyle]}>
			{showCamera && isFocused ? (
				<CameraView
					style={styles.camera}
					facing='back'
					onBarcodeScanned={isScanning && !isProcessing ? handleBarcodeScanned : undefined}
					barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
					enableTorch={flashMode}
				/>
			) : (
				<View style={[styles.camera, {
					backgroundColor: colors.surfaceRoom,
					justifyContent: 'center',
					alignItems: 'center'
				}]}>
					<Text style={[styles.loadingText, { color: colors.fontTitlesLabels }]}>
						{isFocused ? i18n.t('Initializing_Camera') : i18n.t('Camera_Paused')}
					</Text>
				</View>
			)}

			<View style={styles.overlay}>
				<View style={[styles.topOverlay, { backgroundColor: colors.overlayBackground }]} />
				<View style={styles.middleSection}>
					<View style={[styles.sideOverlay, { backgroundColor: colors.overlayBackground }]} />
					<View style={styles.scannerArea} />
					<View style={[styles.sideOverlay, { backgroundColor: colors.overlayBackground }]} />
				</View>
				<View style={[styles.bottomOverlay, { backgroundColor: colors.overlayBackground }]} />
			</View>

			<View style={styles.header}>
				<Pressable
					style={[styles.closeButton, {
						backgroundColor: colors.strokeLight
					}]}
					onPress={handleClose}
					disabled={isProcessing}
				>
					<CustomIcon name='close' size={24} color={colors.fontPureWhite} />
				</Pressable>
				<View style={styles.instructionContainer}>
					<Text style={[styles.instructionText, { color: colors.fontPureWhite }]}>
						{isProcessing ? i18n.t('QR_Code_Verifying') : i18n.t('QR_Login')}
					</Text>
					<Text style={[styles.subInstructionText, { color: colors.fontAnnotation }]}>
						{isProcessing ? i18n.t('QR_Code_Verification_Wait') : i18n.t('QR_Login_Description')}
					</Text>
				</View>
			</View>

			<View style={styles.scannerFrame}>
				{[
					{ position: styles.topLeft, name: 'topLeft' },
					{ position: styles.topRight, name: 'topRight' },
					{ position: styles.bottomLeft, name: 'bottomLeft' },
					{ position: styles.bottomRight, name: 'bottomRight' }
				].map(({ position, name }) => (
					<Animated.View key={name} style={[styles.corner, position, cornerStyle]}>
						<View style={[styles.cornerHorizontal, {
							backgroundColor: colors.badgeBackgroundLevel4,
							shadowColor: colors.badgeBackgroundLevel4
						}]} />
						<View style={[styles.cornerVertical, {
							backgroundColor: colors.badgeBackgroundLevel4,
							shadowColor: colors.badgeBackgroundLevel4
						}]} />
					</Animated.View>
				))}

				{showCamera && !isProcessing && (
					<Animated.View style={[styles.scanLine, scanLineStyle]} />
				)}

				{isProcessing && (
					<View style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: [{ translateX: -25 }, { translateY: -25 }],
						width: 50,
						height: 50,
						backgroundColor: colors.surfaceNeutral,
						borderRadius: 25,
						justifyContent: 'center',
						alignItems: 'center'
					}}>
						<ActivityIndicator size='large' color={colors.badgeBackgroundLevel4} />
					</View>
				)}
			</View>

			<View style={styles.footer}>
				<View style={styles.footerControls}>
					<Pressable
						style={[
							styles.controlButton,
							{
								backgroundColor: flashMode ? colors.badgeBackgroundLevel4 : colors.strokeLight,
								opacity: showCamera && !isProcessing ? 1 : 0.5
							}
						]}
						onPress={toggleFlash}
						disabled={!showCamera || isProcessing}
					>
						<CustomIcon name='record' size={24} color={flashMode ? colors.fontPureBlack : colors.fontPureWhite} />
					</Pressable>
				</View>
			</View>
		</Animated.View>
	);
};

export default QRLoginScanView;