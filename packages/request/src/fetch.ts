/**
 * A very basic Fetch Handler
 *
 * @module @ember-data/request/fetch
 * @main @ember-data/request/fetch
 */

import type { Context } from './-private/context';

const _fetch: typeof fetch =
  typeof fetch !== 'undefined'
    ? fetch
    : typeof FastBoot !== 'undefined'
    ? (FastBoot.require('node-fetch') as typeof fetch)
    : ((() => {
        throw new Error('No Fetch Implementation Found');
      }) as typeof fetch);
/**
 * A basic handler which onverts a request into a
 * `fetch` call presuming the response to be `json`.
 *
 * ```ts
 * import Fetch from '@ember-data/request/fetch';
 *
 * manager.use([Fetch]);
 * ```
 *
 * @class Fetch
 * @public
 */
const Fetch = {
  async request(context: Context) {
    const response = await _fetch(context.request.url!, context.request);
    context.setResponse(response);

    return response.json();
  },
};

export default Fetch;
