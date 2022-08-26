import { TIconsName } from '../CustomIcon';

export type IEmojiCategory =
	| 'frequentlyUsed'
	| 'custom'
	| 'people'
	| 'nature'
	| 'food'
	| 'activity'
	| 'travel'
	| 'objects'
	| 'symbols'
	| 'flags';
const tabs: {
	key: TIconsName;
	title: IEmojiCategory;
}[] = [
	{
		key: 'clock',
		title: 'frequentlyUsed'
	},
	{
		key: 'rocket',
		title: 'custom'
	},
	{
		key: 'emoji',
		title: 'people'
	},
	{
		key: 'leaf',
		title: 'nature'
	},
	{
		key: 'burger',
		title: 'food'
	},
	{
		key: 'basketball',
		title: 'activity'
	},
	{
		key: 'airplane',
		title: 'travel'
	},
	{
		key: 'lamp-bulb',
		title: 'objects'
	},
	{
		key: 'percentage',
		title: 'symbols'
	},
	{
		key: 'flag',
		title: 'flags'
	}
];
export default tabs;
