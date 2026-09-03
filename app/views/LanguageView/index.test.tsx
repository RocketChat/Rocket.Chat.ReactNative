import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import LanguageView from './index';
import * as i18n from '../../i18n';

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() })
}));

jest.mock('../../lib/hooks/useAppSelector', () => ({
	useAppSelector: () => ({ languageDefault: 'en', id: 'user-id' })
}));

jest.mock('react-redux', () => ({
	useDispatch: () => jest.fn()
}));

jest.mock('../../actions/app', () => ({
	appStart: jest.fn()
}));

jest.mock('../../actions/login', () => ({
	setUser: jest.fn()
}));

jest.mock('react-native-restart', () => ({
	Restart: { Restart: jest.fn() }
}));

jest.mock('react-native', () => {
	const rn = jest.requireActual('react-native');
	rn.FlatList = ({ data, renderItem }: any) => (
		<>
			{data.map((item: any, index: number) => (
				<React.Fragment key={item?.value ?? index}>{renderItem({ item, index })}</React.Fragment>
			))}
		</>
	);
	return rn;
});

jest.mock('../../lib/services/restApi', () => ({
	saveUserPreferences: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/database', () => ({
	default: {
		servers: {
			write: jest.fn((fn: any) => fn()),
			get: jest.fn(() => ({
				find: jest.fn(() => Promise.resolve({ update: jest.fn() }))
			}))
		}
	}
}));

jest.mock('../../i18n', () => {
	const setLanguage = jest.fn();
	const i18nMock = {
		t: (key: string) => key,
		locale: 'en',
		translations: { en: {} }
	};
	return {
		__esModule: true,
		default: i18nMock,
		setLanguage,
		isRTL: jest.fn(() => false),
		LANGUAGES: [
			{ label: 'English', value: 'en', file: () => ({}) },
			{ label: 'Español', value: 'es', file: () => ({}) }
		]
	};
});

describe('LanguageView language change', () => {
	it('applies the selected language at runtime via setLanguage', async () => {
		const { findByTestId } = render(<LanguageView />);

		const spanishOption = await findByTestId('language-view-es', {}, { timeout: 5000 });
		fireEvent(spanishOption, 'onPress');

		await waitFor(
			() => {
				expect((i18n as any).setLanguage).toHaveBeenCalledWith('es');
			},
			{ timeout: 5000 }
		);
	});
});
