import { useCallback, useEffect, useRef } from 'react';
import Modal from 'react-native-modal';

import type { ILockScreenHostProps } from './types';

export const LockScreenHost = ({ visible, requestId, onShown, onHidden, children }: ILockScreenHostProps) => {
	const isFullyShown = useRef(false);

	useEffect(() => {
		if (!visible) {
			isFullyShown.current = false;
			return;
		}
		if (isFullyShown.current) {
			onShown();
		}
	}, [visible, requestId, onShown]);

	const onModalShow = useCallback(() => {
		isFullyShown.current = true;
		onShown();
	}, [onShown]);

	const onModalHide = useCallback(() => {
		isFullyShown.current = false;
		onHidden();
	}, [onHidden]);

	return (
		<Modal
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating
			style={{ margin: 0 }}
			animationIn='fadeIn'
			animationOut='fadeOut'
			onModalShow={onModalShow}
			onModalHide={onModalHide}>
			{children}
		</Modal>
	);
};
