import * as RNLocalize from 'react-native-localize';
import {mocked} from "ts-jest/utils";

jest.mock('react-native-localize');

const mockedi18n = mocked(RNLocalize, true);

describe('i18n', () => {
    it('should work with a language provided by the native library', () => {
        const i18n = require('../../src/i18n/index');

        expect(i18n).toBeTruthy();
    });

    it('should work with the default language', () => {
        mockedi18n.findBestAvailableLanguage.mockImplementation(() => { return });

        const i18n = require('../../src/i18n/index');

        expect(i18n).toBeTruthy();
    });
});
