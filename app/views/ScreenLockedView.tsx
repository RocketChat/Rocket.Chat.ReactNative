import isEmpty from 'lodash/isEmpty';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PasscodeEnter } from '../containers/Passcode';
import { LOCAL_AUTHENTICATE_EMITTER } from '../lib/constants/localAuthentication';
import { CustomIcon } from '../containers/CustomIcon';
import { hasNotch } from '../lib/methods/helpers';
import EventEmitter from '../lib/methods/helpers/events';
import { useDeferredModalSettle } from '../lib/hooks/useDeferredModalSettle';
import { type BiometricInvalidationReason } from '../definitions';
import Touch from '../containers/Touch';

interface IData {
	submit?: () => void;
	cancel?: () => void;
	hasBiometry?: boolean;
	canClose?: boolean;
	reason?: BiometricInvalidationReason;
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	close: {
		position: 'absolute',
		top: hasNotch ? 50 : 30,
		left: 15
	}
});

const ScreenLockedView = () => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<IData>({});
	const [requestId, setRequestId] = useState(0);
	const { onShow, defer, onModalHide } = useDeferredModalSettle<IData>();

	useDeepCompareEffect(() => {
		if (!isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showScreenLock = (args: IData) => {
		onShow(args);
		setRequestId(current => current + 1);
		setData(args);
	};

	// Empty deps, so this closes over the first render's showScreenLock: safe only because
	// useDeferredModalSettle is entirely ref-backed. Adding state there wedges it on a stale closure.
	useEffect(() => {
		const listener = EventEmitter.addEventListener(LOCAL_AUTHENTICATE_EMITTER, showScreenLock);
		return () => {
			EventEmitter.removeListener(LOCAL_AUTHENTICATE_EMITTER, listener);
		};
	}, []);

	const onSubmit = () => {
		defer(data.submit || null);
		setData({});
	};

	const onCancel = () => {
		defer(data.cancel || null);
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
			onModalHide={onModalHide}>
			<GestureHandlerRootView style={styles.container}>
				<PasscodeEnter key={requestId} hasBiometry={!!data?.hasBiometry} reason={data?.reason} finishProcess={onSubmit} />
				{data?.canClose ? (
					<Touch onPress={onCancel} style={styles.close}>
						<CustomIcon name='close' size={30} />
					</Touch>
				) : null}
			</GestureHandlerRootView>
		</Modal>
	);
};

export default ScreenLockedView;
