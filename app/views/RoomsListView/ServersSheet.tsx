import React, { useCallback, useRef } from 'react';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import ServersList from './ServersList';

type ServersSheetProps = {
	visible: boolean;
	onClose: () => void;
};

export function ServersSheet({ visible, onClose }: ServersSheetProps) {
	const ref = useRef<BottomSheet>(null);

	const close = useCallback(() => {
		ref.current?.close();
	}, [ref]);

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} opacity={0.5} disappearsOnIndex={-1} />,
		[]
	);

	if (!visible) {
		return null;
	}

	return (
		<BottomSheet
			ref={ref}
			animateOnMount={true}
			backdropComponent={renderBackdrop}
			enableDynamicSizing={true}
			onClose={onClose}
			enablePanDownToClose={true}>
			<ServersList close={close} />
		</BottomSheet>
	);
}
