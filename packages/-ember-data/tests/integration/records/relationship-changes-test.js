import EmberObject, { get, set } from '@ember/object';
import { alias } from '@ember/object/computed';
import { run } from '@ember/runloop';
import settled from '@ember/test-helpers/settled';

import { module, test } from 'qunit';

import { setupTest } from 'ember-qunit';

import Adapter from '@ember-data/adapter';
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import JSONAPISerializer from '@ember-data/serializer/json-api';

const Author = Model.extend({
  name: attr('string'),
});

const Post = Model.extend({
  author: belongsTo(),
});

const Person = Model.extend({
  firstName: attr('string'),
  lastName: attr('string'),
  siblings: hasMany('person'),
});

const sibling1 = {
  type: 'person',
  id: '1',
  attributes: {
    firstName: 'Dogzn',
    lastName: 'Katz',
  },
};

const sibling1Ref = {
  type: 'person',
  id: '1',
};

const sibling2 = {
  type: 'person',
  id: '2',
  attributes: {
    firstName: 'Katzn',
    lastName: 'Dogz',
  },
};

const sibling2Ref = {
  type: 'person',
  id: '2',
};

const sibling3 = {
  type: 'person',
  id: '3',
  attributes: {
    firstName: 'Snakezn',
    lastName: 'Ladderz',
  },
};

const sibling3Ref = {
  type: 'person',
  id: '3',
};

const sibling4 = {
  type: 'person',
  id: '4',
  attributes: {
    firstName: 'Hamsterzn',
    lastName: 'Gerbilz',
  },
};

const sibling4Ref = {
  type: 'person',
  id: '4',
};

const sibling5 = {
  type: 'person',
  id: '5',
  attributes: {
    firstName: 'Donkeyzn',
    lastName: 'Llamaz',
  },
};

const sibling5Ref = {
  type: 'person',
  id: '5',
};

module('integration/records/relationship-changes - Relationship changes', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('model:author', Author);
    this.owner.register('model:person', Person);
    this.owner.register('model:post', Post);

    this.owner.register('adapter:application', Adapter.extend());
    this.owner.register('serializer:application', JSONAPISerializer.extend());
  });

  test('Calling push with relationship triggers observers once if the relationship was empty and is added to', async function(assert) {
    assert.expect(1);

    let store = this.owner.lookup('service:store');
    let observerCount = 0;

    let person = store.push({
      data: {
        type: 'person',
        id: 'wat',
        attributes: {
          firstName: 'Yehuda',
          lastName: 'Katz',
        },
        relationships: {
          siblings: {
            data: [],
          },
        },
      },
    });

    person.addObserver('siblings.[]', function() {
      observerCount++;
    });

    // make sure the relationship has been accessed at least once so that things
    // are materialized and notifications sent.
    await person.get('siblings');

    store.push({
      data: {
        type: 'person',
        id: 'wat',
        attributes: {},
        relationships: {
          siblings: {
            data: [sibling1Ref],
          },
        },
      },
      included: [sibling1],
    });

    assert.ok(observerCount >= 1, 'siblings observer should be triggered at least once');
  });

  test('Calling push with relationship recalculates computed alias property if the relationship was empty and is added to', function(assert) {
    assert.expect(1);

    let store = this.owner.lookup('service:store');

    let Obj = EmberObject.extend({
      person: null,
      siblings: alias('person.siblings'),
    });

    const obj = Obj.create();

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [],
            },
          },
        },
      });
      set(obj, 'person', store.peekRecord('person', 'wat'));
    });

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling1Ref],
            },
          },
        },
        included: [sibling1],
      });
    });

    run(() => {
      let cpResult = get(obj, 'siblings').toArray();
      assert.equal(cpResult.length, 1, 'siblings cp should have recalculated');
      obj.destroy();
    });
  });

  test('Calling push with relationship recalculates computed alias property to firstObject if the relationship was empty and is added to', function(assert) {
    assert.expect(1);

    let store = this.owner.lookup('service:store');

    let Obj = EmberObject.extend({
      person: null,
      firstSibling: alias('person.siblings.firstObject'),
    });

    const obj = Obj.create();

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [],
            },
          },
        },
      });
      set(obj, 'person', store.peekRecord('person', 'wat'));
    });

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling1Ref],
            },
          },
        },
        included: [sibling1],
      });
    });

    run(() => {
      let cpResult = get(obj, 'firstSibling');
      assert.equal(get(cpResult, 'id'), 1, 'siblings cp should have recalculated');
      obj.destroy();
    });
  });

  test('Calling push with relationship triggers observers once if the relationship was not empty and was added to', function(assert) {
    assert.expect(1);

    let store = this.owner.lookup('service:store');
    let person = null;
    let observerCount = 0;

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [sibling1Ref],
            },
          },
        },
        included: [sibling1],
      });
      person = store.peekRecord('person', 'wat');
    });

    run(() => {
      person.addObserver('siblings.[]', function() {
        observerCount++;
      });
      // prime the pump
      person.get('siblings');
    });

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling1Ref, sibling2Ref],
            },
          },
        },
        included: [sibling2],
      });
    });

    run(() => {
      assert.ok(observerCount >= 1, 'siblings observer should be triggered at least once');
    });
  });

  test('Calling push with relationship triggers observers once if the relationship was made shorter', async function(assert) {
    assert.expect(2);

    let store = this.owner.lookup('service:store');
    let observerCount = 0;

    let person = store.push({
      data: {
        type: 'person',
        id: 'wat',
        attributes: {
          firstName: 'Yehuda',
          lastName: 'Katz',
        },
        relationships: {
          siblings: {
            data: [sibling1Ref],
          },
        },
      },
      included: [sibling1],
    });

    person.addObserver('siblings.[]', function() {
      observerCount++;
    });

    // prime the pump
    await person.get('siblings');

    store.push({
      data: {
        type: 'person',
        id: 'wat',
        attributes: {},
        relationships: {
          siblings: {
            data: [],
          },
        },
      },
      included: [],
    });

    // canonical updates have a runloop to flush before ui notifications occur
    await settled();

    assert.ok(observerCount >= 1, 'siblings observer should be triggered at least once');
    let siblings = await person.get('siblings');
    assert.strictEqual(siblings.length, 0, 'We removed the sibling');
  });

  test('Calling push with relationship triggers observers once if the relationship was reordered', function(assert) {
    assert.expect(1);

    let store = this.owner.lookup('service:store');
    let person = null;
    let observerCount = 0;

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [sibling1Ref, sibling2Ref],
            },
          },
        },
        included: [sibling1, sibling2],
      });
      person = store.peekRecord('person', 'wat');
    });

    run(() => {
      person.addObserver('siblings.[]', function() {
        observerCount++;
      });
      // prime the pump
      person.get('siblings');
    });

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling2Ref, sibling1Ref],
            },
          },
        },
        included: [],
      });
    });

    run(() => {
      assert.ok(observerCount >= 1, 'siblings observer should be triggered at least once');
    });
  });

  test('Calling push with relationship does not trigger observers if the relationship was not changed', function(assert) {
    assert.expect(1);

    let store = this.owner.lookup('service:store');
    let person = null;
    let observerCount = 0;

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [sibling1Ref],
            },
          },
        },
        included: [sibling1],
      });
      person = store.peekRecord('person', 'wat');
    });

    const observerMethod = function() {
      observerCount++;
    };

    run(() => {
      // prime the pump
      person.get('siblings');
      person.addObserver('siblings.[]', observerMethod);
    });

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling1Ref],
            },
          },
        },
        included: [],
      });
    });

    run(() => {
      assert.equal(observerCount, 0, 'siblings observer should not be triggered');
    });

    person.removeObserver('siblings.[]', observerMethod);
  });

  test('Calling push with relationship triggers willChange and didChange with detail when appending', function(assert) {
    let store = this.owner.lookup('service:store');

    let willChangeCount = 0;
    let didChangeCount = 0;

    let observer = {
      arrayWillChange(array, start, removing, adding) {
        willChangeCount++;
        assert.equal(start, 1, 'willChange.start');
        assert.equal(removing, 0, 'willChange.removing');
        assert.equal(adding, 1, 'willChange.adding');
      },

      arrayDidChange(array, start, removed, added) {
        didChangeCount++;
        assert.equal(start, 1, 'didChange.start');
        assert.equal(removed, 0, 'didChange.removed');
        assert.equal(added, 1, 'didChange.added');
      },
    };

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [sibling1Ref],
            },
          },
        },
        included: [sibling1],
      });
    });

    let person = store.peekRecord('person', 'wat');
    let siblings = run(() => person.get('siblings'));

    siblings.addArrayObserver(observer);

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling1Ref, sibling2Ref],
            },
          },
        },
        included: [sibling2],
      });
    });

    assert.equal(willChangeCount, 1, 'willChange observer should be triggered once');
    assert.equal(didChangeCount, 1, 'didChange observer should be triggered once');

    siblings.removeArrayObserver(observer);
  });

  test('Calling push with relationship triggers willChange and didChange with detail when truncating', function(assert) {
    let store = this.owner.lookup('service:store');

    let willChangeCount = 0;
    let didChangeCount = 0;

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [sibling1Ref, sibling2Ref],
            },
          },
        },
        included: [sibling1, sibling2],
      });
    });

    let person = store.peekRecord('person', 'wat');
    let siblings = run(() => person.get('siblings'));

    let observer = {
      arrayWillChange(array, start, removing, adding) {
        willChangeCount++;
        assert.equal(start, 1);
        assert.equal(removing, 1);
        assert.equal(adding, 0);
      },

      arrayDidChange(array, start, removed, added) {
        didChangeCount++;
        assert.equal(start, 1);
        assert.equal(removed, 1);
        assert.equal(added, 0);
      },
    };

    siblings.addArrayObserver(observer);

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling1Ref],
            },
          },
        },
        included: [],
      });
    });

    assert.equal(willChangeCount, 1, 'willChange observer should be triggered once');
    assert.equal(didChangeCount, 1, 'didChange observer should be triggered once');

    siblings.removeArrayObserver(observer);
  });

  test('Calling push with relationship triggers willChange and didChange with detail when inserting at front', function(assert) {
    let store = this.owner.lookup('service:store');

    let willChangeCount = 0;
    let didChangeCount = 0;

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [sibling2Ref],
            },
          },
        },
        included: [sibling2],
      });
    });
    let person = store.peekRecord('person', 'wat');

    let observer = {
      arrayWillChange(array, start, removing, adding) {
        willChangeCount++;
        assert.equal(start, 0, 'change will start at the beginning');
        assert.equal(removing, 0, 'we have no removals');
        assert.equal(adding, 1, 'we have one insertion');
      },

      arrayDidChange(array, start, removed, added) {
        didChangeCount++;
        assert.equal(start, 0, 'change did start at the beginning');
        assert.equal(removed, 0, 'change had no removals');
        assert.equal(added, 1, 'change had one insertion');
      },
    };

    let siblings = run(() => person.get('siblings'));
    siblings.addArrayObserver(observer);

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling1Ref, sibling2Ref],
            },
          },
        },
        included: [sibling2],
      });
    });

    assert.equal(willChangeCount, 1, 'willChange observer should be triggered once');
    assert.equal(didChangeCount, 1, 'didChange observer should be triggered once');

    siblings.removeArrayObserver(observer);
  });

  test('Calling push with relationship triggers willChange and didChange with detail when inserting in middle', function(assert) {
    let store = this.owner.lookup('service:store');

    let willChangeCount = 0;
    let didChangeCount = 0;

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [sibling1Ref, sibling3Ref],
            },
          },
        },
        included: [sibling1, sibling3],
      });
    });
    let person = store.peekRecord('person', 'wat');
    let observer = {
      arrayWillChange(array, start, removing, adding) {
        willChangeCount++;
        assert.equal(start, 1);
        assert.equal(removing, 0);
        assert.equal(adding, 1);
      },
      arrayDidChange(array, start, removed, added) {
        didChangeCount++;
        assert.equal(start, 1);
        assert.equal(removed, 0);
        assert.equal(added, 1);
      },
    };

    let siblings = run(() => person.get('siblings'));
    siblings.addArrayObserver(observer);

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling1Ref, sibling2Ref, sibling3Ref],
            },
          },
        },
        included: [sibling2],
      });
    });

    assert.equal(willChangeCount, 1, 'willChange observer should be triggered once');
    assert.equal(didChangeCount, 1, 'didChange observer should be triggered once');

    siblings.removeArrayObserver(observer);
  });

  test('Calling push with relationship triggers willChange and didChange with detail when replacing different length in middle', function(assert) {
    let store = this.owner.lookup('service:store');

    let willChangeCount = 0;
    let didChangeCount = 0;

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {
            firstName: 'Yehuda',
            lastName: 'Katz',
          },
          relationships: {
            siblings: {
              data: [sibling1Ref, sibling2Ref, sibling3Ref],
            },
          },
        },
        included: [sibling1, sibling2, sibling3],
      });
    });

    let person = store.peekRecord('person', 'wat');
    let observer = {
      arrayWillChange(array, start, removing, adding) {
        willChangeCount++;
        assert.equal(start, 1);
        assert.equal(removing, 1);
        assert.equal(adding, 2);
      },

      arrayDidChange(array, start, removed, added) {
        didChangeCount++;
        assert.equal(start, 1);
        assert.equal(removed, 1);
        assert.equal(added, 2);
      },
    };

    let siblings = run(() => person.get('siblings'));
    siblings.addArrayObserver(observer);

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 'wat',
          attributes: {},
          relationships: {
            siblings: {
              data: [sibling1Ref, sibling4Ref, sibling5Ref, sibling3Ref],
            },
          },
        },
        included: [sibling4, sibling5],
      });
    });

    assert.equal(willChangeCount, 1, 'willChange observer should be triggered once');
    assert.equal(didChangeCount, 1, 'didChange observer should be triggered once');

    siblings.removeArrayObserver(observer);
  });

  test('Calling push with updated belongsTo relationship trigger observer', function(assert) {
    assert.expect(1);

    let store = this.owner.lookup('service:store');
    let observerCount = 0;

    run(() => {
      let post = store.push({
        data: {
          type: 'post',
          id: '1',
          relationships: {
            author: {
              data: { type: 'author', id: '2' },
            },
          },
        },
        included: [
          {
            id: 2,
            type: 'author',
          },
        ],
      });

      post.get('author');

      post.addObserver('author', function() {
        observerCount++;
      });

      store.push({
        data: {
          type: 'post',
          id: '1',
          relationships: {
            author: {
              data: { type: 'author', id: '3' },
            },
          },
        },
      });
    });

    assert.equal(observerCount, 1, 'author observer should be triggered once');
  });

  test('Calling push with same belongsTo relationship does not trigger observer', function(assert) {
    assert.expect(1);

    let store = this.owner.lookup('service:store');
    let observerCount = 0;

    run(() => {
      let post = store.push({
        data: {
          type: 'post',
          id: '1',
          relationships: {
            author: {
              data: { type: 'author', id: '2' },
            },
          },
        },
      });

      post.addObserver('author', function() {
        observerCount++;
      });

      store.push({
        data: {
          type: 'post',
          id: '1',
          relationships: {
            author: {
              data: { type: 'author', id: '2' },
            },
          },
        },
      });
    });

    assert.equal(observerCount, 0, 'author observer should not be triggered');
  });
});
