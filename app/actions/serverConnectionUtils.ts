import { Base64 } from 'js-base64';
import parse from 'url-parse';
import UserPreferences from '../lib/methods/userPreferences';
import { BASIC_AUTH_KEY, setBasicAuth } from '../lib/methods/helpers/fetch';
import { events, logEvent } from '../lib/methods/helpers/log';
import { serializeAsciiUrl } from '../lib/methods';
import {serverRequest } from './server';
import { store } from '../lib/store/auxStore';
// Complete and sanitize URL
function completeUrl(url: string): string {
    const parsedUrl = parse(url, true);

    if (parsedUrl.auth) {
        url = `${parsedUrl.protocol}//${parsedUrl.host}`;
    }

    url = url && url.replace(/\s/g, '');

    if (/^(\w|[0-9-_]){3,}$/.test(url) && !/^(htt(ps?)?)|(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(url)) {
        url = `${url}.rocket.chat`;
    }

    if (/^(https?:\/\/)?(((\w|[0-9-_])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
        if (/^localhost(:\d+)?/.test(url)) {
            url = `http://${url}`;
        } else if (!/^https?:\/\//.test(url)) {
            url = `https://${url}`;
        }
    }

    return serializeAsciiUrl(url.replace(/\/+$/, '').replace(/\\/g, '/'));
}
const basicAuth = (server: string, text: string) => {
    try {
        const parsedUrl = parse(text, true);
        if (parsedUrl.auth.length) {
            const credentials = Base64.encode(parsedUrl.auth);
            UserPreferences.setString(`${BASIC_AUTH_KEY}-${server}`, credentials);
            setBasicAuth(credentials);
        }
    } catch {
        // do nothing
    }
};

export const connectToDefaultServer = (text: string): void => {
    console.log(events.NS_CONNECT_TO_WORKSPACE);
    const server = completeUrl(text);
    basicAuth(server, text);
    store.dispatch(serverRequest(server));
};

