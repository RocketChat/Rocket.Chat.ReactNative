import { TIconsName } from '../CustomIcon';
import { IEmojiCategoryName } from '../../definitions';

const tabs: {
	key: TIconsName;
	title: IEmojiCategoryName;
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
