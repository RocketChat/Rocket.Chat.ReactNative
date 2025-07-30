import moment from 'moment';

import I18n from '../../i18n';

export interface ITimestampFormat {
  label: string;
  value: string;
  momentFormat: string; 
}

export const TIMESTAMP_FORMATS: ITimestampFormat[] = [
	{ 
		label: I18n.t('Timestamp_Format_Short_Time'), 
		value: 't',
		momentFormat: 'LT' 
	},
	{ 
		label: I18n.t('Timestamp_Format_Long_Time'), 
		value: 'T',
		momentFormat: 'LTS'
	},
	{ 
		label: I18n.t('Timestamp_Format_Short_Date'), 
		value: 'd',
		momentFormat: 'L' 
	},
	{ 
		label: I18n.t('Timestamp_Format_Long_Date'), 
		value: 'D',
		momentFormat: 'L, LT' 
	},
	{ 
		label: I18n.t('Timestamp_Format_Full_Date_Time'), 
		value: 'f',
		momentFormat: 'LLL' 
	},
	{ 
		label: I18n.t('Timestamp_Format_Full_Date_Time_Long'), 
		value: 'F',
		momentFormat: 'LLLL'
	},
	{ 
		label: I18n.t('Timestamp_Format_Relative_Time'), 
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