import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Animated, TouchableOpacity, Alert, Vibration, BackHandler } from 'react-native';
import { CameraView, ScanningResult } from 'expo-camera';

import styles, { SCANNER_SIZE } from './styles';
import { CustomIcon } from '../../containers/CustomIcon';
import i18n from '../../i18n';
import { useTheme } from '../../theme';
import { sendScannedQRCode } from '../../lib/services/restApi';

const QRLoginScanView = ({ navigation }: { navigation?: any }) => {
	const { colors } = useTheme();
	const scanLineAnim = useRef(new Animated.Value(0)).current;
	const cornerAnim = useRef(new Animated.Value(1)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;

	const [flashMode, setFlashMode] = useState<boolean>(false);
	const [isScanning, setIsScanning] = useState(true);
	const [lastScanTime, setLastScanTime] = useState(0);
	const [isActive, setIsActive] = useState(true);

	const SCAN_COOLDOWN = 2000;

	useEffect(() => {
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true
		}).start();

		const scanAnimation = Animated.loop(
			Animated.sequence([
				Animated.timing(scanLineAnim, {
					toValue: 1,
					duration: 2000,
					useNativeDriver: true
				}),
				Animated.timing(scanLineAnim, {
					toValue: 0,
					duration: 2000,
					useNativeDriver: true
				})
			])
		);

		const cornerAnimation = Animated.loop(
			Animated.sequence([
				Animated.timing(cornerAnim, {
					toValue: 0.6,
					duration: 1500,
					useNativeDriver: true
				}),
				Animated.timing(cornerAnim, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: true
				})
			])
		);

		if (isScanning) {
			scanAnimation.start();
			cornerAnimation.start();
		}

		return () => {
			scanAnimation.stop();
			cornerAnimation.stop();
		};
	}, [isScanning, scanLineAnim, cornerAnim, fadeAnim]);

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

	const handleBarcodeScanned = useCallback(
		async (scanningResult: ScanningResult) => {
			const now = Date.now();
			console.debug(scanningResult);
			const response = await sendScannedQRCode(scanningResult.data);
			console.debug('sendScannedQRCode response', response);
			if (now - lastScanTime < SCAN_COOLDOWN) {
				return;
			}

			setLastScanTime(now);
			setIsScanning(false);

			if (Vibration) {
				Vibration.vibrate(100);
			}

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
		},
		[lastScanTime, handleClose]
	);

	const toggleFlash = useCallback(() => {
		setFlashMode(current => !current);
	}, []);

	const scanLineTranslateY = scanLineAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, SCANNER_SIZE - 4]
	});

	return (
		<Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: colors.surfaceRoom }]}>
			<CameraView
				style={styles.camera}
				facing='back'
				onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
				barcodeScannerSettings={{
					barcodeTypes: ['qr']
				}}
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
					<Animated.View key={name} style={[styles.corner, position, { opacity: cornerAnim }]}>
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

				<Animated.View
					style={[
						styles.scanLine,
						{
							transform: [{ translateY: scanLineTranslateY }],
							opacity: isScanning ? 1 : 0,
							backgroundColor: colors.badgeBackgroundLevel4,
							shadowColor: colors.badgeBackgroundLevel4
						}
					]}
				/>
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
