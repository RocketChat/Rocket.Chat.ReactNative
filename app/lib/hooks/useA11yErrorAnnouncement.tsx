import { useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { FieldErrorsImpl } from 'react-hook-form';

import { useDebounce } from '../methods/helpers';
import { textInputDebounceTime } from '../constants';

interface IUseA11yErrorAnnouncement {
	errors: FieldErrorsImpl<any>;
}

const useA11yErrorAnnouncement = ({ errors }: IUseA11yErrorAnnouncement) => {
	const previousMessages = useRef<FieldErrorsImpl<any>>(errors);
	const announced = useRef<Record<string, boolean>>({});
	const handleA11yAnnouncement = useDebounce(() => {
		const hasError = Object.keys(errors).length;
		if (!hasError) {
			announced.current = {};
			previousMessages.current = {};
			return;
		}

		Object.entries(errors).forEach(([fieldName, error]: [string, any]) => {
			const message = error?.message?.trim();

			if (message && message !== previousMessages.current[fieldName] && !announced.current[fieldName]) {
				AccessibilityInfo.announceForAccessibility(message);
				announced.current[fieldName] = true;
				previousMessages.current[fieldName] = message;
			}
			if (!message) {
				announced.current[fieldName] = false;
				delete previousMessages.current[fieldName];
			}
		});
	}, textInputDebounceTime);

	handleA11yAnnouncement();
};

export default useA11yErrorAnnouncement;
