import React, { useEffect, useMemo, useRef } from 'react';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import ServersList from './ServersList';

export function ServersSheet({ onClose }: { onClose: () => void }) {
	const bottomSheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ['25%', '50%'], []);

	useEffect(() => {
		if (bottomSheetRef.current) {
			bottomSheetRef.current.expand();
		}
	}, []);

	return (
		<BottomSheet
			ref={bottomSheetRef}
			backdropComponent={BottomSheetBackdrop}
			index={1}
			enableDynamicSizing={false}
			snapPoints={snapPoints}
			onClose={onClose}
			animateOnMount={true}>
			<ServersList
				close={() => {
					bottomSheetRef.current?.close();
				}}
			/>
		</BottomSheet>
	);
}
