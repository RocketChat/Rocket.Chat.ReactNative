import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Touchable from 'react-native-platform-touchable';
import useDeepCompareEffect from 'use-deep-compare-effect';

import { PasscodeEnter } from '../containers/Passcode';
import { LOCAL_AUTHENTICATE_EMITTER } from '../lib/constants';
import { CustomIcon } from '../containers/CustomIcon';
import { hasNotch } from '../lib/methods/helpers';
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
		const listener = EventEmitter.addEventListener(LOCAL_AUTHENTICATE_EMITTER, showScreenLock);
		return () => {
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
			animationOut='fadeOut'>
			<PasscodeEnter hasBiometry={!!data?.hasBiometry} finishProcess={onSubmit} />
			{data?.force ? (
				<Touchable onPress={onCancel} style={styles.close}>
					<CustomIcon name='close' size={30} />
				</Touchable>
			) : null}
		</Modal>
	);
};

export default ScreenLockedView;
