import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Orientation from 'react-native-orientation-locker';
import Touchable from 'react-native-platform-touchable';
import useDeepCompareEffect from 'use-deep-compare-effect';

import { PasscodeEnter } from '../containers/Passcode';
import { LOCAL_AUTHENTICATE_EMITTER } from '../lib/constants';
import { CustomIcon } from '../containers/CustomIcon';
import { useTheme } from '../theme';
import { hasNotch, isTablet } from '../lib/methods/helpers';
import EventEmitter from '../lib/methods/helpers/events';

interface IData {
	submit?: () => void;
	cancel?: () => void;
	hasBiometry?: boolean;
	force?: boolean;
}

const styles = StyleSheet.create({
	close: {
		position: 'absolute',
		top: hasNotch ? 50 : 30,
		left: 15
	}
});

const ScreenLockedView = (): JSX.Element => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<IData>({});
	const { colors } = useTheme();

	useDeepCompareEffect(() => {
		if (!isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showScreenLock = (args: IData) => {
		setData(args);
	};

	useEffect(() => {
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
		const listener = EventEmitter.addEventListener(LOCAL_AUTHENTICATE_EMITTER, showScreenLock);
		return () => {
			if (!isTablet) {
				Orientation.unlockAllOrientations();
			}
			EventEmitter.removeListener(LOCAL_AUTHENTICATE_EMITTER, listener);
		};
	}, []);

	const onSubmit = () => {
		const { submit } = data;
		if (submit) {
			submit();
		}
		setData({});
	};

	const onCancel = () => {
		const { cancel } = data;
		if (cancel) {
			cancel();
		}
		setData({});
	};

	return (
		<Modal
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating
			style={{ margin: 0 }}
			animationIn='fadeIn'
			animationOut='fadeOut'
		>
			<PasscodeEnter hasBiometry={!!data?.hasBiometry} finishProcess={onSubmit} />
			{data?.force ? (
				<Touchable onPress={onCancel} style={styles.close}>
					<CustomIcon name='close' color={colors.passcodePrimary} size={30} />
				</Touchable>
			) : null}
		</Modal>
	);
};

export default ScreenLockedView;
