import { useState } from 'react';

export const usePrevious = <T>(value: T): T => {
	const [current, setCurrent] = useState(value);
	const [previous, setPrevious] = useState(value);

	if (!Object.is(value, current)) {
		setCurrent(value);
		setPrevious(current);
	}

	return previous;
};
