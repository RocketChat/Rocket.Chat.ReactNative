const list = ['frequentlyUsed', 'people', 'nature', 'food', 'activity', 'travel', 'objects', 'symbols', 'flags', 'custom'];
const tabs = [
	{
		tabLabel: 'clock',
		category: list[0]
	},
	{
		tabLabel: 'emoji',
		category: list[1]
	},
	{
		tabLabel: 'leaf',
		category: list[2]
	},
	{
		tabLabel: 'burger',
		category: list[3]
	},
	{
		tabLabel: 'basketball',
		category: list[4]
	},
	{
		tabLabel: 'airplane',
		category: list[5]
	},
	{
		tabLabel: 'lamp-bulb',
		category: list[6]
	},
	{
		tabLabel: 'percentage',
		category: list[7]
	},
	{
		tabLabel: 'flag',
		category: list[8]
	},
	{
		tabLabel: 'rocket',
		category: list[9]
	}
] as const;
export const categories = { list, tabs };
