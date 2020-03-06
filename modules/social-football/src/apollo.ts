import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import SecurityManager from './security/security-manager';
import config from './config/config';
import 'cross-fetch/polyfill';
import { createUploadLink } from 'apollo-upload-client';

/**
 * Provide authorisation for Apollo.
 * If RefreshUsingToken then don't add access token because it is obtaining a new one.
 *
 * @param all
 * @param headers
 * @returns {all, headers}
 */
export const authLinkProcessor = async(all, { headers }) => {
    const base = {
        uri: config.api,
    };

    if (all?.operationName === 'RefreshUsingToken') {
        return {
            ...base,
            headers,
        };
    }

    const token = await SecurityManager.getAccessToken();

    return {
        ...base,
        headers: {
            ...headers,
            authorization: token ? `Bearer ${ token }` : ''
        }
    };
};

export const authLink = setContext(authLinkProcessor);

// specify how objects should be identified
export const cacheKeyGenerator = o => o._id;
const cache = new InMemoryCache({ dataIdFromObject: cacheKeyGenerator});

/**
 * Setup the ApolloClient.
 * Use the ApolloLink to define the link of operations before execution.
 *
 * @param link
 * @param authLink
 * @param uri
 * @param cache
 * @returns {ApolloClient}
 */
const client = new ApolloClient({
    link: ApolloLink.from([
        authLink.concat(createUploadLink()),
    ]),
    cache,
});
authLinkProcessor(null, { headers: {} }).then(a => console.info('f', JSON.stringify(a)));
export default client;
