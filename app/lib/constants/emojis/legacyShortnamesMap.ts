import legacyShortnames from './legacyShortnames.json';

// Must NOT share a basename with legacyShortnames.json: Metro resolves .json before .ts,
// so an extensionless import of './legacyShortnames' loads the JSON and this named export
// comes back undefined at runtime (jest resolves .ts first and won't catch it).
export const legacyShortnameToUnicodeMap: { [key: string]: string } = legacyShortnames;
