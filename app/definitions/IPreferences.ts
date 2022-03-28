import { SortBy, DisplayMode } from '../lib/constants/constantDisplayMode';

export interface IPreferences {
	sortBy: SortBy;
	groupByType: boolean;
	showFavorites: boolean;
	showUnread: boolean;
	showAvatar: boolean;
	displayMode: DisplayMode;
}
