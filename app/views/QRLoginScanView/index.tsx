import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Alert,
	Vibration,
	BackHandler,
	ActivityIndicator
} from 'react-native';
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

import { staticStyles } from './styles';
import { CustomIcon } from '../../containers/CustomIcon';
import i18n from '../../i18n';
import { useTheme } from '../../theme';
import { sendScannedQRCode } from '../../lib/services/restApi';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const SCANNER_SIZE = 280;

const QRLoginScanView = ({ navigation }: { navigation?: any }) => {
	const { width: screenWidth, height: screenHeight } = useResponsiveLayout();
	const { colors } = useTheme();
	const [permission, requestPermission] = useCameraPermissions();
	const isFocused = useIsFocused();

	const [flashMode, setFlashMode] = useState(false);
	const [isScanning, setIsScanning] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [lastScanTime, setLastScanTime] = useState(0);
	const [showCamera, setShowCamera] = useState(false);

	const isMounted = useRef(true);

	const fadeAnim = useSharedValue(0);
	const scanLineAnim = useSharedValue(0);
	const cornerAnim = useSharedValue(1);

	const scannerFrame = {
		position: 'absolute' as const,
		top: (screenHeight - SCANNER_SIZE) / 2,
		left: (screenWidth - SCANNER_SIZE) / 2,
		width: SCANNER_SIZE,
		height: SCANNER_SIZE
	};

	const topOverlay = {
		height: (screenHeight - SCANNER_SIZE) / 2
	};

	const sideOverlay = {
		width: (screenWidth - SCANNER_SIZE) / 2
	};

	useEffect(() => {
		if (isFocused && permission?.granted) {
			const timer = setTimeout(() => {
				if (isMounted.current) {
					setShowCamera(true);
				}
			}, 100);
			return () => clearTimeout(timer);
		}
		setShowCamera(false);
	}, [isFocused, permission?.granted]);

	useFocusEffect(
		useCallback(() => {
			isMounted.current = true;
			setFlashMode(false);
			setLastScanTime(0);
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
				isMounted.current = false;
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

	useEffect(() => () => {
		isMounted.current = false;
		cancelAnimation(fadeAnim);
		cancelAnimation(scanLineAnim);
		cancelAnimation(cornerAnim);
	}, [fadeAnim, scanLineAnim, cornerAnim]);

	const fadeStyle = useAnimatedStyle(() => ({
		opacity: fadeAnim.value,
		backgroundColor: colors.surfaceRoom
	}));

	const scanLineStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: scanLineAnim.value * (SCANNER_SIZE - 4) }],
		opacity: isScanning && !isProcessing ? 1 : 0,
		backgroundColor: colors.badgeBackgroundLevel4,
		shadowColor: colors.badgeBackgroundLevel4
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
		if (!isMounted.current || isProcessing) return;

		const now = Date.now();

		if (now - lastScanTime < 3000 || !isScanning) return;

		setLastScanTime(now);
		setIsScanning(false);
		setIsProcessing(true);

		Vibration?.vibrate?.(100);

		const { data } = scanningResult;

		if (!data?.trim()) {
			setIsProcessing(false);
			Alert.alert(
				i18n.t('Error'),
				i18n.t('QR_Code_Invalid'),
				[{
					text: i18n.t('Try_Again'),
					onPress: () => {
						setIsScanning(true);
					}
				}]
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
			} else throw new Error(i18n.t('QR_Verification_Error_Description'));
		} catch (error: any) {
			console.log('Error sending QR code:', error);
			setIsProcessing(false);
			Alert.alert(
				i18n.t('QR_Verification_Error'),
				error?.data?.message ?? i18n.t('QR_Verification_Error_Description'),
				[
					{
						text: i18n.t('Try_again'),
						onPress: () => {
							setIsScanning(true);
						}
					},
					{ text: i18n.t('Close'), onPress: handleClose, style: 'cancel' }
				]
			);
		}
	};

	const toggleFlash = () => {
		setFlashMode(prev => !prev);
	};

	if (!permission) {
		return (
			<View style={[staticStyles.container, { backgroundColor: colors.surfaceRoom, justifyContent: 'center', alignItems: 'center' }]}>
				<Text style={[staticStyles.loadingText, { color: colors.fontTitlesLabels }]}>Loading camera...</Text>
			</View>
		);
	}

	if (!permission.granted) {
		return (
			<View style={[staticStyles.container, { backgroundColor: colors.surfaceRoom }]}>
				<View style={staticStyles.permissionContainer}>
					<CustomIcon name='camera' size={64} color={colors.fontTitlesLabels} />
					<Text style={[staticStyles.permissionTitle, { color: colors.fontTitlesLabels }]}>Camera Permission Required</Text>
					<Text style={[staticStyles.permissionText, { color: colors.fontAnnotation }]}>We need access to your camera to scan QR codes</Text>
					<TouchableOpacity
						style={[staticStyles.permissionButton, { backgroundColor: colors.badgeBackgroundLevel4 }]}
						onPress={requestPermission}
					>
						<Text style={[staticStyles.permissionButtonText, { color: '#000' }]}>Grant Permission</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={handleClose}>
						<Text style={[staticStyles.closeButtonText, { color: colors.fontAnnotation }]}>Close</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<Animated.View style={[staticStyles.container, fadeStyle]}>
			{showCamera && isFocused ? (
				<CameraView
					style={staticStyles.camera}
					facing='back'
					onBarcodeScanned={isScanning && !isProcessing ? handleBarcodeScanned : undefined}
					barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
					enableTorch={flashMode}
				/>
			) : (
				<View style={[staticStyles.camera, { backgroundColor: colors.surfaceRoom, justifyContent: 'center', alignItems: 'center' }]}>
					<Text style={[staticStyles.loadingText, { color: colors.fontTitlesLabels }]}>
						{isFocused ? 'Initializing camera...' : 'Camera paused'}
					</Text>
				</View>
			)}

			<View style={staticStyles.overlay}>
				<View style={[topOverlay, { backgroundColor: colors.overlayBackground }]} />
				<View style={staticStyles.middleSection}>
					<View style={[sideOverlay, { backgroundColor: colors.overlayBackground }]} />
					<View style={staticStyles.scannerArea} />
					<View style={[sideOverlay, { backgroundColor: colors.overlayBackground }]} />
				</View>
				<View style={[staticStyles.bottomOverlay, { backgroundColor: colors.overlayBackground }]} />
			</View>

			<View style={staticStyles.header}>
				<TouchableOpacity
					style={[staticStyles.closeButton, { backgroundColor: colors.surfaceNeutral, borderColor: colors.strokeLight }]}
					onPress={handleClose}
					disabled={isProcessing}
				>
					<CustomIcon name='close' size={24} color='#fff' />
				</TouchableOpacity>
				<View style={staticStyles.instructionContainer}>
					<Text style={[staticStyles.instructionText, { color: colors.fontTitlesLabels }]}>
						{isProcessing ? 'Verifying QR Code...' : i18n.t('QR_Login')}
					</Text>
					<Text style={[staticStyles.subInstructionText, { color: colors.fontAnnotation }]}>
						{isProcessing ? 'Please wait while we verify your code' : i18n.t('QR_Login_Description')}
					</Text>
				</View>
			</View>

			<View style={scannerFrame}>
				{[
					{ position: staticStyles.topLeft, name: 'topLeft' },
					{ position: staticStyles.topRight, name: 'topRight' },
					{ position: staticStyles.bottomLeft, name: 'bottomLeft' },
					{ position: staticStyles.bottomRight, name: 'bottomRight' }
				].map(({ position, name }) => (
					<Animated.View key={name} style={[staticStyles.corner, position, cornerStyle]}>
						<View style={[staticStyles.cornerHorizontal, { backgroundColor: colors.badgeBackgroundLevel4, shadowColor: colors.badgeBackgroundLevel4 }]} />
						<View style={[staticStyles.cornerVertical, { backgroundColor: colors.badgeBackgroundLevel4, shadowColor: colors.badgeBackgroundLevel4 }]} />
					</Animated.View>
				))}
				{showCamera && !isProcessing && <Animated.View style={[staticStyles.scanLine, scanLineStyle]} />}

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

			<View style={staticStyles.footer}>
				<View style={staticStyles.footerControls}>
					<TouchableOpacity
						style={[
							staticStyles.controlButton,
							{
								backgroundColor: flashMode ? colors.badgeBackgroundLevel4 : colors.surfaceNeutral,
								borderColor: flashMode ? colors.badgeBackgroundLevel4 : colors.strokeLight,
								opacity: showCamera && !isProcessing ? 1 : 0.5
							}
						]}
						onPress={toggleFlash}
						disabled={!showCamera || isProcessing}
					>
						<CustomIcon name='record' size={24} color={flashMode ? '#000' : '#fff'} />
					</TouchableOpacity>
				</View>
			</View>
		</Animated.View>
	);
};

export default QRLoginScanView;