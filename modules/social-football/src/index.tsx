import React, { forwardRef } from 'react';
import { ApolloProvider } from 'react-apollo';
import Apollo from './apollo';
import { Navigation } from './navigation';
import SecurityManager from './security/security-manager';

/**
* Main creation file using the Apollo client.
* Forwards all references to the Navigation.
* 
* @param props, ref
* @returns {(ApolloProvider)}
*/

SecurityManager.init();

export const SocialFootballModule = forwardRef((props, ref) => {
    return <ApolloProvider client={Apollo}>
        <Navigation ref={ref} />
    </ApolloProvider>
});
