import React, { useState } from 'react';

import { IMentionsPreferences } from './definitions/IMentionsPreferences';
import { MENTIONS_PREFERENCES_KEY } from './lib/constants';
import UserPreferences from './lib/methods/userPreferences';

interface IMentionsPreferencesContextProps extends IMentionsPreferences {
	toggleMentionsWithAtSymbol: () => void;
	togglRoomsWithHashTag: () => void;
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
	togglRoomsWithHashTag: () => {}
});

export const MentionsPreferencesProvider: React.FC<IMentionsPreferencesProvider> = ({
	children,
	mentionsPreferences = defaultPreferences
}) => {
	const [preferences, setPreferences] = useState<IMentionsPreferences>(mentionsPreferences);

	const toggleMentionsWithAtSymbol = () => {
		setPreferences({ ...preferences, mentionsWithAtSymbol: !preferences.mentionsWithAtSymbol });
		UserPreferences.setMap(MENTIONS_PREFERENCES_KEY, { ...preferences, mentionsWithAtSymbol: !preferences.mentionsWithAtSymbol });
	};

	const togglRoomsWithHashTag = () => {
		setPreferences({ ...preferences, roomsWithHashTagSymbol: !preferences.roomsWithHashTagSymbol });
		UserPreferences.setMap(MENTIONS_PREFERENCES_KEY, {
			...preferences,
			roomsWithHashTagSymbol: !preferences.roomsWithHashTagSymbol
		});
	};

	return (
		<MentionsPreferencesContext.Provider value={{ ...preferences, toggleMentionsWithAtSymbol, togglRoomsWithHashTag }}>
			{children}
		</MentionsPreferencesContext.Provider>
	);
};

export const useMentionsPreferences = (): IMentionsPreferencesContextProps => React.useContext(MentionsPreferencesContext);
