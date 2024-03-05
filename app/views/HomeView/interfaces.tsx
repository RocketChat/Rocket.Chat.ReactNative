import { TColors } from '../../theme';

export enum SizeTypes {
	SMALL = 'small',
	LARGE = 'large'
}

export interface Tileprops {
	icon: any;
	title: string;
	size: SizeTypes;
	screen: string;
	color: TColors;
	disabled?: boolean;
}
