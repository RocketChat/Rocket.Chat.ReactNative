import { useEffect, useState } from 'react';

const takeSnapshot = (item: any) => (item.asPlain ? item.asPlain() : { ...item });

export const useRoomSnapshot = (item: any) => {
	const [observed, setObserved] = useState<{ source: any; room: any } | null>(null);
	useEffect(() => {
		const subscription = item.observe?.().subscribe(() => setObserved({ source: item, room: takeSnapshot(item) }));
		return () => subscription?.unsubscribe();
	}, [item]);
	return observed && observed.source === item ? observed.room : takeSnapshot(item);
};
