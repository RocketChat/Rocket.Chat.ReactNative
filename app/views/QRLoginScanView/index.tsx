import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Vibration, BackHandler } from 'react-native';
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

import { styles, SCANNER_SIZE } from './styles';
import { CustomIcon } from '../../containers/CustomIcon';
import i18n from '../../i18n';
import { useTheme } from '../../theme';
import { sendScannedQRCode } from '../../lib/services/restApi';

const SCAN_COOLDOWN = 5000;

const QRLoginScanView = ({ navigation }: { navigation?: any }) => {
	const { colors } = useTheme();
	const [permission, requestPermission] = useCameraPermissions();
	const isFocused = useIsFocused();

	const [flashMode, setFlashMode] = useState(false);
	const [isScanning, setIsScanning] = useState(true);
	const [lastScanTime, setLastScanTime] = useState(0);
	const [showCamera, setShowCamera] = useState(false);

	const isMounted = useRef(true);

	const fadeAnim = useSharedValue(0);
	const scanLineAnim = useSharedValue(0);
	const cornerAnim = useSharedValue(1);

	useEffect(() => {
		if (isFocused && permission?.granted) {
			const timer = setTimeout(() => {
				if (isMounted.current) {
					setShowCamera(true);
				}
			}, 100);
			return () => clearTimeout(timer);
		} else
			// eslint-disable-next-line no-else-return
			setShowCamera(false);

	}, [isFocused, permission?.granted]);

	useFocusEffect(
		useCallback(() => {
			isMounted.current = true;

			setFlashMode(false);
			setLastScanTime(0);
			setIsScanning(true);

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

				cancelAnimation(fadeAnim);
				cancelAnimation(scanLineAnim);
				cancelAnimation(cornerAnim);
			};
		}, [fadeAnim, scanLineAnim, cornerAnim])
	);

	useEffect(() => {
		if (isScanning && showCamera) {
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
	}, [isScanning, showCamera, scanLineAnim, cornerAnim]);

	// eslint-disable-next-line arrow-body-style
	useEffect(() => {
		return () => {
			isMounted.current = false;
			cancelAnimation(fadeAnim);
			cancelAnimation(scanLineAnim);
			cancelAnimation(cornerAnim);
		};
	}, []);

	const fadeStyle = useAnimatedStyle(() => ({
		opacity: fadeAnim.value,
		backgroundColor: colors.surfaceRoom
	}));

	const scanLineStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: scanLineAnim.value * (SCANNER_SIZE - 4) }],
		opacity: isScanning ? 1 : 0,
		backgroundColor: colors.badgeBackgroundLevel4,
		shadowColor: colors.badgeBackgroundLevel4
	}));

	const cornerStyle = useAnimatedStyle(() => ({
		opacity: cornerAnim.value
	}));

	const handleClose = useCallback(() => {
		navigation?.goBack();
		return true;
	}, [navigation]);

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', handleClose);
		return () => backHandler.remove();
	}, [handleClose]);

	const handleBarcodeScanned = async (scanningResult: BarcodeScanningResult) => {
		if (!isMounted.current) return;

		const now = Date.now();

		if (now - lastScanTime < SCAN_COOLDOWN || !isScanning) {
			return;
		}

		console.log('QR Code Scanned:', scanningResult.data);
		setLastScanTime(now);
		setIsScanning(false);

		Vibration?.vibrate(100);

		const { data } = scanningResult;

		if (!data?.trim()) {
			Alert.alert(
				i18n.t('Error'),
				i18n.t('QR_Code_Invalid'),
				[{ text: i18n.t('Try_Again'), onPress: () => setIsScanning(true) }]
			);
			return;
		}

		try {
			await sendScannedQRCode(data);

			console.log('Success - navigate to success screen');
			// navigation.navigate('QRSuccess', { data });
		} catch (error) {
			console.log('Error sending QR code:', error);

			console.log('Error - navigate to error screen');
			// navigation.navigate('QRError', { error });
		}
	};

	const toggleFlash = useCallback(() => {
		setFlashMode(prev => !prev);
	}, []);

	const retryScan = useCallback(() => {
		setIsScanning(true);
		setLastScanTime(0);
	}, []);

	if (!permission) {
		return (
			<View style={[styles.container, { backgroundColor: colors.surfaceRoom, justifyContent: 'center', alignItems: 'center' }]}>
				<Text style={[styles.loadingText, { color: colors.fontTitlesLabels }]}>
					Loading camera...
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
						Camera Permission Required
					</Text>
					<Text style={[styles.permissionText, { color: colors.fontAnnotation }]}>
						We need access to your camera to scan QR codes
					</Text>
					<TouchableOpacity
						style={[styles.permissionButton, { backgroundColor: colors.badgeBackgroundLevel4 }]}
						onPress={requestPermission}
					>
						<Text style={[styles.permissionButtonText, { color: '#000' }]}>
							Grant Permission
						</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={handleClose}>
						<Text style={[styles.closeButtonText, { color: colors.fontAnnotation }]}>
							Close
						</Text>
					</TouchableOpacity>
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
					onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
					barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
					enableTorch={flashMode}
				/>
			) : (
				<View style={[styles.camera, { backgroundColor: colors.surfaceRoom, justifyContent: 'center', alignItems: 'center' }]}>
					<Text style={[styles.loadingText, { color: colors.fontTitlesLabels }]}>
						{isFocused ? 'Initializing camera...' : 'Camera paused'}
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
				<TouchableOpacity
					style={[styles.closeButton, { backgroundColor: colors.surfaceNeutral, borderColor: colors.strokeLight }]}
					onPress={handleClose}
				>
					<CustomIcon name='close' size={24} color='#fff' />
				</TouchableOpacity>

				<View style={styles.instructionContainer}>
					<Text style={[styles.instructionText, { color: colors.fontTitlesLabels }]}>
						{i18n.t('QR_Login')}
					</Text>
					<Text style={[styles.subInstructionText, { color: colors.fontAnnotation }]}>
						{i18n.t('QR_Login_Description')}
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
						<View style={[styles.cornerHorizontal, { backgroundColor: colors.badgeBackgroundLevel4, shadowColor: colors.badgeBackgroundLevel4 }]} />
						<View style={[styles.cornerVertical, { backgroundColor: colors.badgeBackgroundLevel4, shadowColor: colors.badgeBackgroundLevel4 }]} />
					</Animated.View>
				))}

				{showCamera && <Animated.View style={[styles.scanLine, scanLineStyle]} />}
			</View>

			<View style={styles.footer}>
				<View style={styles.footerControls}>
					<TouchableOpacity
						style={[
							styles.controlButton,
							{
								backgroundColor: flashMode ? colors.badgeBackgroundLevel4 : colors.surfaceNeutral,
								borderColor: flashMode ? colors.badgeBackgroundLevel4 : colors.strokeLight,
								opacity: showCamera ? 1 : 0.5
							}
						]}
						onPress={toggleFlash}
						disabled={!showCamera}
					>
						<CustomIcon name='record' size={24} color={flashMode ? '#000' : '#fff'} />
					</TouchableOpacity>

					{!isScanning && showCamera && (
						<TouchableOpacity
							style={[styles.controlButton, { backgroundColor: colors.surfaceNeutral, borderColor: colors.strokeLight }]}
							onPress={retryScan}
						>
							<CustomIcon name='refresh' size={24} color='#fff' />
						</TouchableOpacity>
					)}
				</View>
			</View>
		</Animated.View>
	);
};

export default QRLoginScanView;