import { type RefObject, useEffect, useRef } from 'react';

// Ref refreshed every render (no deps array), so a narrowly-keyed effect can read the latest closure
// without listing it as a dependency. Blessed escape hatch for the intentional deps-less mirror.
// Stand-in for useEffectEvent (stable in React 19.2); migrate 1:1 once RN ships React >= 19.2.
export function useLiveRef<T>(value: T): RefObject<T> {
	const ref = useRef(value);
	useEffect(() => {
		ref.current = value;
	});
	return ref;
}
