import React, { useCallback, useRef } from 'react';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

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

	if (!visible) {
		return null;
	}

	return (
		<BottomSheet
			ref={ref}
			animateOnMount={true}
			backdropComponent={props => <BottomSheetBackdrop {...props} opacity={0.5} disappearsOnIndex={-1} />}
			enableDynamicSizing={true}
			// snapPoints={snapPoints}
			onClose={onClose}
			enablePanDownToClose={true}>
			<ServersList close={close} />
		</BottomSheet>
	);
}
