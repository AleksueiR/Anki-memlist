import { Store } from 'vuex';
import { Payload } from 'vuex-pathify';
import { RootState } from './state';

/**
 *
 *
 * @export
 * @param {Store<RootState>} vuexStore
 * @param {Dexie.Table} dbStore
 * @param {*} stateProp
 * @param {string} statePropPath
 * @param {*} payload
 * @returns {(Promise<{ id: number; field: string; payload: Payload } | void>)}
 */
export async function handleActionPayload(
    vuexStore: Store<RootState>,
    dbStore: Dexie.Table,
    stateProp: any,
    statePropPath: string,
    payload: any
): Promise<{ id: number; field: string; payload: Payload } | void> {
    // if not a Payload, call the default pathify mutation
    if (!(payload instanceof Payload)) {
        vuexStore.set(statePropPath, payload);
        return;
    }

    // update the state using the payload function as expected and pass it to the default pathify mutation
    vuexStore.set(statePropPath, payload.update(stateProp));

    const [id, field, ...rest] = payload.path.split('.');

    // this check might not be needed if all call are proper
    if (rest.length > 0) {
        console.warn('Attempting to change a deep property');
    }

    // update the corresponding db objects
    await dbStore.update(+id, { [field]: payload.value });

    return {
        id: +id,
        field,
        payload
    };
}
