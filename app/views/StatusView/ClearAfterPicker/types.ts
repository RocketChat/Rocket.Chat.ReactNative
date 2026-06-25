export type ClearAfterValue = '' | '30' | '60' | 'custom';

export const CLEAR_AFTER_OPTIONS: { value: ClearAfterValue; labelKey: string }[] = [
	{ value: '', labelKey: 'Status_dont_clear' },
	{ value: '30', labelKey: 'Status_30_minutes' },
	{ value: '60', labelKey: 'Status_1_hour' },
	{ value: 'custom', labelKey: 'Status_choose_date_and_time' }
];
