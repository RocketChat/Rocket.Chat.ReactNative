import I18n from '../../i18n';

const list = ['frequentlyUsed', 'custom', 'people', 'nature', 'food', 'activity', 'travel', 'objects', 'symbols', 'flags'];
const tabs = [
	{
		tabLabel: '🕒',
		category: list[0],
		name: I18n.t('Frequently_Used')
	},
	{
		tabLabel: '🚀',
		category: list[1],
		name: I18n.t('Custom')
	},
	{
		tabLabel: '😃',
		category: list[2],
		name: I18n.t('Smileys_and_People')
	},
	{
		tabLabel: '🐶',
		category: list[3],
		name: I18n.t('Animals_and_Nature')
	},
	{
		tabLabel: '🍔',
		category: list[4],
		name: I18n.t('Food_and_Drink')
	},
	{
		tabLabel: '⚽',
		category: list[5],
		name: I18n.t('Activity')
	},
	{
		tabLabel: '🚌',
		category: list[6],
		name: I18n.t('Travel_and_Places')
	},
	{
		tabLabel: '💡',
		category: list[7],
		name: I18n.t('Objects')
	},
	{
		tabLabel: '💛',
		category: list[8],
		name: I18n.t('Symbols')
	},
	{
		tabLabel: '🏁',
		category: list[9],
		name: I18n.t('Flags')
	}
];
export default { list, tabs };
