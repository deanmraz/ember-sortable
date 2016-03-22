import Ember from 'ember';
import layout from '../templates/components/sortable-group';
import computed from 'ember-new-computed';
import { EKMixin, keyUp } from 'ember-keyboard';
const { A, Component, get, set, run } = Ember;
const a = A;
const NO_MODEL = {};

export default Component.extend(EKMixin, {
  layout: layout,

  /**
    @property direction
    @type string
    @default y
  */
  direction: 'y',

  /**
    @property model
    @type Any
    @default null
  */
  model: NO_MODEL,

  /**
    @property items
    @type Ember.NativeArray
  */
  items: computed(() => a()),

  /**
    Position for the first item.
    If spacing is present, first item's position will have to change as well.
    @property itemPosition
    @type Number
  */
  itemPosition: computed(function() {
    let direction = this.get('direction');

    return this.get(`sortedItems.firstObject.${direction}`) - this.get('sortedItems.firstObject.spacing');
  }).volatile(),

  /**
    @property sortedItems
    @type Array
  */
  sortedItems: computed(function() {
    let items = a(this.get('items'));
    let direction = this.get('direction');

    return items.sortBy(direction);
  }).volatile(),

  /**
    Register an item with this group.
    @method registerItem
    @param {SortableItem} [item]
  */
  registerItem(item) {
    this.get('items').addObject(item);
  },

  /**
    De-register an item with this group.
    @method deregisterItem
    @param {SortableItem} [item]
  */
  deregisterItem(item) {
    this.get('items').removeObject(item);
  },

  /**
    Prepare for sorting.
    Main purpose is to stash the current itemPosition so
    we don’t incur expensive re-layouts.
    @method prepare
  */
  prepare() {
    this._itemPosition = this.get('itemPosition');
  },

  /**
    Update item positions (relatively to the first element position).
    @method update
  */
  update() {
    let sortedItems = this.get('sortedItems');
    // Position of the first element
    let position = this._itemPosition;

    // Just in case we haven’t called prepare first.
    if (position === undefined) {
      position = this.get('itemPosition');
    }

    sortedItems.forEach(item => {
      let dimension;
      let direction = this.get('direction');

      if (!get(item, 'isDragging')) {
        set(item, direction, position);
      }

      // add additional spacing around active element
      if (get(item, 'isBusy')) {
        position += get(item, 'spacing') * 2;
      }

      if (direction === 'x') {
        dimension = 'width';
      }
      if (direction === 'y') {
        dimension = 'height';
      }

      position += get(item, dimension);
    });
  },

  /**
    @method commit
  */
  commit() {
    let items = this.get('sortedItems');
    let groupModel = this.get('model');
    let itemModels = items.mapBy('model');
    let draggedItem = items.findBy('wasDropped', true);
    let draggedModel;

    if (draggedItem) {
      set(draggedItem, 'wasDropped', false); // Reset
      draggedModel = get(draggedItem, 'model');
    }

    delete this._itemPosition;

    run.schedule('render', () => {
      items.invoke('freeze');
    });

    run.schedule('afterRender', () => {
      items.invoke('reset');
    });

    run.next(() => {
      run.schedule('render', () => {
        items.invoke('thaw');
      });
    });

    if (groupModel !== NO_MODEL) {
      this.sendAction('onChange', groupModel, itemModels, draggedModel);
    } else {
      this.sendAction('onChange', itemModels, draggedModel);
    }
  },

  currentIndex: null,
  moving: false,

  up: Ember.on(keyUp('ArrowUp'), function() {
    this.handleShift(-1);
  }),

  down: Ember.on(keyUp('ArrowDown'), function() {
    this.handleShift(1);
  }),

  m: Ember.on(keyUp('m'), function() {
    let moving = this.get('moving');
    let currentIndex = this.get('currentIndex');
    let items = [].concat(this.get('sortedItems'));

    if(moving) {
      items[currentIndex].set('isDragging', false);
      items[currentIndex].set('isDropping', true);
    } else {
      items[currentIndex].set('isDragging', true);
      items[currentIndex].set('isDropping', false);
    }

    this.toggleProperty('moving');
  }),

  handleShift(shift) {
    let moving = this.get('moving');
    if(moving) this.shiftItem(shift);
    else this.nextItem(shift);
  },

  newIndex(shift) {
    let currentIndex = this.get('currentIndex');
    let total = this.get('items').length;
    let arrayMaxIndex = total - 1;
    let newIndex;
    // next
    if(shift > 0) {
      newIndex = (currentIndex == arrayMaxIndex) ? 0 : currentIndex + 1;
    } // prev
    else {
      newIndex = currentIndex == 0 ? arrayMaxIndex : currentIndex - 1;
    }
    return newIndex;
  },

  nextItem(shift) {
    let currentIndex = this.get('currentIndex');
    let items = [].concat(this.get('sortedItems'));
    let newIndex;

    // start fresh
    if(currentIndex == null) {
      newIndex = shift > 0 ? 0 : arrayMaxIndex;
    } // Use highlighted
    else {
      newIndex = this.newIndex(shift);
      // remove old highlighted
      items[currentIndex].set('isDropping', false);
    }
    // set the new highlighted
    items[newIndex].set('isDropping', true);
    this.set('currentIndex', newIndex);
  },

  shiftItem(shift) {
    let items = [].concat(this.get('items'));
    let currentIndex = this.get('currentIndex');
    let item = items[currentIndex]; // TODO this is not returning the right item
    let newIndex = this.newIndex(shift);

    debugger;

    items.splice(currentIndex, 1);
    items.splice(newIndex, 0, item);

    let models = items.map(i => i.model);

    this.sendAction('onChange', models, item);

    this.set('currentIndex', newIndex);

    debugger;
  }

});
