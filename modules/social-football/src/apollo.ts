import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import SecurityManager from './security/security-manager';
import config from './config/config';
import 'cross-fetch/polyfill';

export const authLinkProcessor = async(all, { headers }) => {
    if (all?.operationName === 'RefreshUsingToken') {
        return {
            headers,
        };
    }

    const token = await SecurityManager.getAccessToken();

    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${ token }` : ''
        }
    };
};

export const authLink = setContext(authLinkProcessor);

const cache = new InMemoryCache();

const client = new ApolloClient({
    link: ApolloLink.from([
        authLink,
        new HttpLink({
            uri: config.api,
        })
    ]),
    cache,
});

export default client;
