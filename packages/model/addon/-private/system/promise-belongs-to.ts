import { assert } from '@ember/debug';
import { computed } from '@ember/object';

import type { InternalModel } from '@ember-data/store/-private';
import { PromiseObject } from '@ember-data/store/-private';
import type Store from '@ember-data/store/-private/system/store';
import type { Dict } from '@ember-data/store/-private/ts-interfaces/utils';
import type { ResolvedRegistry } from '@ember-data/types';
import type { RecordField, RecordInstance, RecordType } from '@ember-data/types/utils';

export interface BelongsToProxyMeta<
  R extends ResolvedRegistry,
  T extends RecordType<R>,
  K extends RecordField<R, T>,
  J extends RecordType<R> = RecordType<R>
> {
  /**
   * the key on the record
   * @internal
   */
  key: K;
  store: Store<R>;
  /**
   * the InternalModel that owns this relationship proxy
   * @internal
   */
  originatingInternalModel: InternalModel<R, T>;
  /**
   * wat
   * @internal
   */
  modelName: J;
}
export interface BelongsToProxyCreateArgs<
  R extends ResolvedRegistry,
  T extends RecordType<R>,
  K extends RecordField<R, T>,
  RT extends RecordType<R>
> {
  promise: Promise<R['model'][RT] | null>;
  content: R['model'][RT] | null;
  _belongsToState: BelongsToProxyMeta<R, T, K, RT>;
}

/**
 @module @ember-data/model
 */

/**
  A PromiseBelongsTo is a PromiseObject that also proxies certain method calls
  to the underlying belongsTo model.
  Right now we proxy:
    * `reload()`
  @class PromiseBelongsTo
  @extends PromiseObject
  @private
*/
class PromiseBelongsTo<
  R extends ResolvedRegistry,
  T extends RecordType<R>,
  K extends RecordField<R, T>,
  RT extends RecordType<R>
> extends PromiseObject<RecordInstance<R, RT>> {
  declare _belongsToState: BelongsToProxyMeta<R, T, K, RT>;
  // we don't proxy meta because we would need to proxy it to the relationship state container
  //  however, meta on relationships does not trigger change notifications.
  //  if you need relationship meta, you should do `record.belongsTo(relationshipName).meta()`
  @computed()
  get meta() {
    // eslint-disable-next-line no-constant-condition
    if (1) {
      assert(
        'You attempted to access meta on the promise for the async belongsTo relationship ' +
          `${this._belongsToState.modelName}:${this._belongsToState.key}'.` +
          '\nUse `record.belongsTo(relationshipName).meta()` instead.',
        false
      );
    }
    return;
  }

  async reload(options: Dict<unknown>): Promise<this> {
    assert('You are trying to reload an async belongsTo before it has been created', this.content !== undefined);
    let { key, store, originatingInternalModel } = this._belongsToState;
    await store.reloadBelongsTo(this, originatingInternalModel, key, options);
    return this;
  }
}

export default PromiseBelongsTo;
