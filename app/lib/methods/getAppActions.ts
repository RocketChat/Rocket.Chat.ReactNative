import database from '../database';
import { store as reduxStore } from '../store/auxStore';
import sdk from '../services/sdk';
import { IAppActionButton, TAppActionButtonModel } from 'definitions';
import protectedFunction from './helpers/protectedFunction';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

export const getAppActions = async () => {
    const db = database.active;

    return new Promise<void>(async resolve => {
        try {
            const { server, login: { user } } = reduxStore.getState();
            const { server: baseURL } = server;
            const { token, id: userId } = user;
    
            if(!userId || !token) {
                console.log('getAppActions', 'token not found', token, userId)
                return;
            }
    
            const headers = new Headers();
            headers.append('X-User-Id', userId);
            headers.append('X-Auth-Token', token);
            
            const appActionButtons = (await sdk.get('actionButtons', undefined, 'apps')) as unknown as IAppActionButton[];
            // const appActionButtons = await (await fetch(`${baseURL}/api/apps/actionButtons`, { headers: headers })).json();
    
            console.log('getAppActions - ', appActionButtons)
    
            if (appActionButtons && appActionButtons.length) {
                await db.write(async () => {
                    const appActionButtonsCollection = db.get('app_actions_buttons');
                    const allAppActionButtonsRecords = await appActionButtonsCollection.query().fetch();

                    console.log('getAppActions test', allAppActionButtonsRecords)

                    const filteredAppActionButtonsToCreate = appActionButtons.filter(
                        (i1: IAppActionButton) => !allAppActionButtonsRecords.find(i2 => `${i1.appId}/${i1.actionId}` === `${i2.appId}/${i2.actionId}`)
                    );
                    
                    const filteredAppActionButtonsToUpdate = allAppActionButtonsRecords.filter(
                        (i1) => appActionButtons.find((i2: IAppActionButton) => `${i1.appId}/${i1.actionId}` === `${i2.appId}/${i2.actionId}`)
                    );
    
                    const filteredAppActionButtonsToDelete = allAppActionButtonsRecords.filter(
                        i1 => 
                            !filteredAppActionButtonsToCreate.find((i2: IAppActionButton) => `${i1.appId}/${i1.actionId}` === `${i2.appId}/${i2.actionId}`)
                            &&
                            !filteredAppActionButtonsToUpdate.find(i2 => `${i1.appId}/${i1.actionId}` === `${i2.appId}/${i2.actionId}`)
                    );
    
                    const appActionButtonsToCreate = filteredAppActionButtonsToCreate.map((action: IAppActionButton) => 
                        appActionButtonsCollection.prepareCreate(
                            protectedFunction((s: TAppActionButtonModel) => {
                                s._raw = sanitizedRaw({ id: `${action.appId}/${action.actionId}` }, appActionButtonsCollection.schema);
                                Object.assign(s, action);
                            })
                        )
                    );

                    const appActionButtonsToUpdate = filteredAppActionButtonsToUpdate.map((action) => {
                        const newAction = appActionButtons.find((s: IAppActionButton) => `${s.appId}/${s.actionId}` === `${action.appId}/${action.actionId}`);
                        return action.prepareUpdate(
                            protectedFunction((s: TAppActionButtonModel) => {
                                Object.assign(s, newAction);
                            })
                        );
                    });

                    const appActionButtonsToDelete = filteredAppActionButtonsToDelete.map(action => action.prepareDestroyPermanently());

                    const allRecords = [...appActionButtonsToCreate, ...appActionButtonsToUpdate, ...appActionButtonsToDelete];

                    try {
                        await db.batch(...allRecords);
                    } catch (e) {
                        console.log('getAppActions - Error', e)
                    }
                    return allRecords.length;
                });
            }

            return resolve();
    
        } catch (e) {
            console.log('getAppActions Error', JSON.stringify(e));
            return resolve();
        }
    });
}

