import { renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import type { ReactNode } from 'react';

import { mockedStore } from '~/reducers/mockedStore';
import { addSettings, clearSettings } from '~/actions/settings';
import { useParseOptions } from '../useParseOptions';

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const renderParseOptions = () => renderHook(() => useParseOptions(), { wrapper: Wrapper }).result.current;

afterEach(() => {
	mockedStore.dispatch(clearSettings());
});

it('converts emoticons like the web client', () => {
	expect(renderParseOptions().emoticons).toBe(true);
});

it('auto-links the custom domains from Message_CustomDomain_AutoLink', () => {
	mockedStore.dispatch(addSettings({ Message_CustomDomain_AutoLink: ' intranet.local, , corp.lan ' }));
	expect(renderParseOptions().customDomains).toEqual(['intranet.local', 'corp.lan']);
});

it('passes no custom domains when the setting is empty', () => {
	expect(renderParseOptions().customDomains).toEqual([]);
});

it('passes katex syntaxes only when katex is enabled', () => {
	mockedStore.dispatch(addSettings({ Katex_Enabled: true, Katex_Dollar_Syntax: true, Katex_Parenthesis_Syntax: false }));
	expect(renderParseOptions().katex).toEqual({ dollarSyntax: true, parenthesisSyntax: false });
});
