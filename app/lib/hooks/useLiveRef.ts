import { type RefObject, useEffect, useRef } from 'react';

// Ref refreshed every render (no deps array), so a narrowly-keyed effect can read the latest closure
// without listing it as a dependency. Blessed escape hatch for the intentional deps-less mirror.
export function useLiveRef<T>(value: T): RefObject<T> {
	const ref = useRef(value);
	useEffect(() => {
		ref.current = value;
	});
	return ref;
}
