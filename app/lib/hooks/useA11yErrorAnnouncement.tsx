import { useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { FieldErrorsImpl } from 'react-hook-form';

import { useDebounce } from '../methods/helpers';
import { accessibilityErrorAnnouncementDebounceTime } from '../constants';

type TInputValues = {
	[key: string]: any;
};

interface IUseA11yErrorAnnouncement {
	errors: FieldErrorsImpl<any>;
	inputValues: TInputValues;
}

const useA11yErrorAnnouncement = ({ errors, inputValues }: IUseA11yErrorAnnouncement) => {
	const previousInputValues = useRef<TInputValues>(inputValues);

	const handleA11yAnnouncement = useDebounce(() => {
		const hasError = Object.keys(errors).length;

		if (!hasError) {
			previousInputValues.current = inputValues;
			return;
		}

		Object.entries(errors).forEach(([fieldName, error]: [string, any]) => {
			const message = error?.message?.trim();
			if (message && inputValues[fieldName] !== previousInputValues.current[fieldName]) {
				AccessibilityInfo.announceForAccessibility(message);
			}
		});

		previousInputValues.current = inputValues;
	}, accessibilityErrorAnnouncementDebounceTime);

	handleA11yAnnouncement();
};

export default useA11yErrorAnnouncement;
