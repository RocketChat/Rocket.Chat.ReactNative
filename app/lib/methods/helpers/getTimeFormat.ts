const TWELVE_HOUR_FORMAT = 'h:mm A';
const TWENTY_FOUR_HOUR_FORMAT = 'H:mm';

export const getTimeFormat = (clockMode: number | undefined, serverFormat: string): string => {
	switch (clockMode) {
		case 1:
			return TWELVE_HOUR_FORMAT;
		case 2:
			return TWENTY_FOUR_HOUR_FORMAT;
		default:
			return serverFormat;
	}
};
