import React, { useState } from 'react';

import { IMentionsPreferences } from '../../definitions/IMentionsPreferences';
import { MENTIONS_PREFERENCES_KEY } from '../constants';
import UserPreferences from '../methods/userPreferences';

interface IMentionsPreferencesContextProps extends IMentionsPreferences {
	toggleMentionsWithAtSymbol: () => void;
	toggleRoomsWithHashTag: () => void;
}

interface IMentionsPreferencesProvider {
	children: React.ReactNode;
	mentionsPreferences?: IMentionsPreferences;
}

const defaultPreferences: IMentionsPreferences = {
	mentionsWithAtSymbol: false,
	roomsWithHashTagSymbol: false
};

export const MentionsPreferencesContext = React.createContext<IMentionsPreferencesContextProps>({
	...defaultPreferences,
	toggleMentionsWithAtSymbol: () => {},
	toggleRoomsWithHashTag: () => {}
});

export const MentionsPreferencesProvider = ({ children, mentionsPreferences }: IMentionsPreferencesProvider) => {
	const [preferences, setPreferences] = useState<IMentionsPreferences>(mentionsPreferences ?? defaultPreferences);

	const toggleMentionsWithAtSymbol = () => {
		setPreferences({ ...preferences, mentionsWithAtSymbol: !preferences.mentionsWithAtSymbol });
		UserPreferences.setMap(MENTIONS_PREFERENCES_KEY, { ...preferences, mentionsWithAtSymbol: !preferences.mentionsWithAtSymbol });
	};

	const toggleRoomsWithHashTag = () => {
		setPreferences({ ...preferences, roomsWithHashTagSymbol: !preferences.roomsWithHashTagSymbol });
		UserPreferences.setMap(MENTIONS_PREFERENCES_KEY, {
			...preferences,
			roomsWithHashTagSymbol: !preferences.roomsWithHashTagSymbol
		});
	};

	return (
		<MentionsPreferencesContext.Provider value={{ ...preferences, toggleMentionsWithAtSymbol, toggleRoomsWithHashTag }}>
			{children}
		</MentionsPreferencesContext.Provider>
	);
};

export const useMentionsPreferences = (): IMentionsPreferencesContextProps => React.useContext(MentionsPreferencesContext);
