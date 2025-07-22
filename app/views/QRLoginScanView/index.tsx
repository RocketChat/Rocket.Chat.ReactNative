import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Vibration, BackHandler } from 'react-native';
import { CameraView, ScanningResult } from 'expo-camera';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withRepeat,
	withSequence
} from 'react-native-reanimated';

import { createDynamicStyles } from './styles';
import { CustomIcon } from '../../containers/CustomIcon';
import i18n from '../../i18n';
import { useTheme } from '../../theme';
import { sendScannedQRCode } from '../../lib/services/restApi';
import { useResponsiveScannerSize } from './useResponsiveLayout';

const SCAN_COOLDOWN = 2000;
const QRLoginScanView = ({ navigation }: { navigation?: any }) => {
	const { colors } = useTheme();

	const [flashMode, setFlashMode] = useState<boolean>(false);
	const [isScanning, setIsScanning] = useState(true);
	const [lastScanTime, setLastScanTime] = useState(0);
	const [isActive, setIsActive] = useState(true);
	const SCANNER_SIZE = useResponsiveScannerSize();
	const styles = createDynamicStyles(SCANNER_SIZE);

	const fadeAnim = useSharedValue(0);
	const scanLineAnim = useSharedValue(0);
	const cornerAnim = useSharedValue(1);


	useEffect(() => {
		fadeAnim.value = withTiming(1, { duration: 300 });

		if (isScanning) {
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
		}
	}, [cornerAnim, fadeAnim, isScanning, scanLineAnim]);

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
		navigation.goBack();
		return true;
	}, [navigation]);

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', handleClose);
		return () => backHandler.remove();
	}, [handleClose]);

	useEffect(() => {
		const unsubscribeFocus = navigation?.addListener('focus', () => {
			setIsActive(true);
			setIsScanning(true);
		});

		const unsubscribeBlur = navigation?.addListener('blur', () => {
			setIsActive(false);
			setIsScanning(false);
		});

		return () => {
			unsubscribeFocus?.();
			unsubscribeBlur?.();
		};
	}, [navigation]);

	const handleBarcodeScanned =
		async (scanningResult: ScanningResult) => {
			const now = Date.now();
			const response = await sendScannedQRCode(scanningResult.data);
			console.debug('QR Code Scanned Response:', response);

			if (now - lastScanTime < SCAN_COOLDOWN) return;

			setLastScanTime(now);
			setIsScanning(false);

			if (Vibration) Vibration.vibrate(100);

			const { data } = scanningResult;

			if (!data || data.trim() === '') {
				Alert.alert(i18n.t('Error'), i18n.t('QR_Code_Invalid'), [
					{ text: i18n.t('Try_Again'), onPress: () => setIsScanning(true) }
				]);
				return;
			}

			Alert.alert('Scanned Result', data, [
				{ text: 'Scan Again', onPress: () => setIsScanning(true) },
				{ text: i18n.t('Close'), onPress: handleClose }
			]);
		};

	const toggleFlash = () => {
		setFlashMode(current => !current);
	};

	return (
		<Animated.View style={[styles.container, fadeStyle]}>
			<CameraView
				style={styles.camera}
				facing='back'
				onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
				barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
				active={isActive}
				enableTorch={flashMode}
			/>

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
					style={[
						styles.closeButton,
						{
							backgroundColor: colors.surfaceNeutral,
							borderColor: colors.strokeLight
						}
					]}
					onPress={handleClose}>
					<CustomIcon name='close' size={24} color='#fff' />
				</TouchableOpacity>

				<View style={styles.instructionContainer}>
					<Text style={[styles.instructionText, { color: colors.fontTitlesLabels }]}>{i18n.t('QR_Login')}</Text>
					<Text style={[styles.subInstructionText, { color: colors.fontAnnotation }]}>{i18n.t('QR_Login_Description')}</Text>
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
						<View
							style={[
								styles.cornerHorizontal,
								{
									backgroundColor: colors.badgeBackgroundLevel4,
									shadowColor: colors.badgeBackgroundLevel4
								}
							]}
						/>
						<View
							style={[
								styles.cornerVertical,
								{
									backgroundColor: colors.badgeBackgroundLevel4,
									shadowColor: colors.badgeBackgroundLevel4
								}
							]}
						/>
					</Animated.View>
				))}

				<Animated.View style={[styles.scanLine, scanLineStyle]} />
			</View>

			<View style={styles.footer}>
				<View style={styles.footerControls}>
					<TouchableOpacity
						style={[
							styles.controlButton,
							{
								backgroundColor: flashMode ? colors.badgeBackgroundLevel4 : colors.surfaceNeutral,
								borderColor: flashMode ? colors.badgeBackgroundLevel4 : colors.strokeLight
							}
						]}
						onPress={toggleFlash}>
						<CustomIcon name={'record'} size={24} color={flashMode ? '#000' : '#fff'} />
					</TouchableOpacity>

					{!isScanning && (
						<TouchableOpacity
							style={[
								styles.controlButton,
								{
									backgroundColor: colors.surfaceNeutral,
									borderColor: colors.strokeLight
								}
							]}
							onPress={() => setIsScanning(true)}>
							<CustomIcon name='refresh' size={24} color='#fff' />
						</TouchableOpacity>
					)}
				</View>
			</View>
		</Animated.View>
	);
};

export default QRLoginScanView;
