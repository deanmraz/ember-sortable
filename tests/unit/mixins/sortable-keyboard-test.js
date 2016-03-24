import Ember from 'ember';
import SortableKeyboardMixin from 'ember-sortable/mixins/sortable-keyboard';
import { module, test } from 'qunit';

module('Unit | Mixin | sortable keyboard');

// Replace this with your real tests.
test('it works', function(assert) {
  let SortableKeyboardObject = Ember.Object.extend(SortableKeyboardMixin);
  let subject = SortableKeyboardObject.create();
  assert.ok(subject);
});
