import moment from 'moment';

export interface ITimestampFormat {
  label: string;
  value: string;
  momentFormat: string; 
}

export const TIMESTAMP_FORMATS: ITimestampFormat[] = [
	{ 
		label: 'Short time (12:00 AM)', 
		value: 't',
		momentFormat: 'LT' 
	},
	{ 
		label: 'Long time (12:00:00 AM)', 
		value: 'T',
		momentFormat: 'LTS'
	},
	{ 
		label: 'Short date (12/31/2020)', 
		value: 'd',
		momentFormat: 'L' 
	},
	{ 
		label: 'Long date (12/31/2020, 12:00 AM)', 
		value: 'D',
		momentFormat: 'LL, LT' 
	},
	{ 
		label: 'Full date and time (December 31, 2020 at 12:00:00 AM)', 
		value: 'f',
		momentFormat: 'LLL' 
	},
	{ 
		label: 'Full date and time (long) (Thursday, December 31, 2020 12:00:00 AM)', 
		value: 'F',
		momentFormat: 'LLLL'
	},
	{ 
		label: 'Relative time (1 year ago)', 
		value: 'R',
		momentFormat: 'fromNow'
	}
];

export const formatTimestamp = (date: Date, formatValue: string): string => {
  const momentDate = moment(date);
  const format = TIMESTAMP_FORMATS.find(f => f.value === formatValue);
  
  if (!format) {
    return momentDate.format('LLL'); 
  }
  
  if (format.momentFormat === 'fromNow') {
    return momentDate.fromNow(); 
  }
  
  return momentDate.format(format.momentFormat);
};


export const getUnixTimestamp = (date: Date): number => Math.floor(date.getTime() / 1000);

export const createTimestampString = (date: Date, formatValue: string): string => {
  const timestamp = getUnixTimestamp(date);
  return `<t:${timestamp}:${formatValue}>`;
};

export const isValidTimestampFormat = (formatValue: string): boolean => 
  TIMESTAMP_FORMATS.some(format => format.value === formatValue);