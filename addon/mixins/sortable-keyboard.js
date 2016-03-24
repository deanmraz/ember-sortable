import Ember from 'ember';
import { EKMixin, keyUp } from 'ember-keyboard';
const { on, computed }  = Ember;

export default Ember.Mixin.create(EKMixin, {

  /**
   * Current array index selected by keyboard arrow keys
   * @property currentIndex
   * @type number
   * @default null
   */
  _currentIndex: null,

  /**
   * Moving state. Are you currently moving the current index?
   * @property moving
   * @type boolean
   * @default false
   */
  _moving: false,

  itemArrayMax: computed(function() {
    return this.get('items').length - 1;
  }).readOnly(),

  getItemByIndex(index) {
    let items = this.get('sortedItems');
    return items[index];
  },

  /**
   * Shift Previous binding
   */
  prev: on(keyUp('ArrowUp'), keyUp('ArrowLeft'), function() {
    this.handleShift(-1);
  }),

  /**
   * Shift Next binding
   */
  next: on(keyUp('ArrowDown'), keyUp('ArrowRight'), function() {
    this.handleShift(1);
  }),

  /**
   * Toggle movement for sorting the _currentIndex item
   */
  m: on(keyUp('m'), function() {
    let moving = this.get('_moving');
    let currentIndex = this.get('_currentIndex');

    if(moving) {
      this.getItemByIndex(currentIndex).setProperties({
        isDragging: false,
        isDropping: true
      });
      this.commit();
    } else {
      this.getItemByIndex(currentIndex).setProperties({
        isDragging: true,
        isDropping: false
      });
    }

    this.toggleProperty('_moving');
  }),

  /**
   * Handle action type
   */
  handleShift(shift) {
    let moving = this.get('_moving');
    if(moving) this.shiftItem(shift);
    else this.nextItem(shift);
  },

  /**
   * Get the new index
   */
  newIndex(shift) {
    let currentIndex = this.get('_currentIndex');
    let arrayMaxIndex = this.get('itemArrayMax');

    // next
    if(shift > 0) {
      return (currentIndex == arrayMaxIndex) ? currentIndex : currentIndex + 1;
    } // prev
    else {
      return currentIndex == 0 ? currentIndex : currentIndex - 1;
    }
  },

  /**
   * Select the next/prev item
   */
  nextItem(shift) {
    let currentIndex = this.get('_currentIndex');
    let arrayMaxIndex = this.get('itemArrayMax');
    let newIndex;

    // start fresh
    if(currentIndex == null) {
      newIndex = shift > 0 ? 0 : arrayMaxIndex;
    } // Use highlighted
    else {
      newIndex = this.newIndex(shift);
      // remove old highlighted
      this.getItemByIndex(currentIndex).set('isDropping', false);
    }
    // set the new highlighted
    this.getItemByIndex(newIndex).set('isDropping', true);

    // update current index
    this.set('_currentIndex', newIndex);
  },

  /**
   * Shift the item
   */
  shiftItem(shift) {
    // get indexes
    let currentIndex = this.get('_currentIndex');
    let newIndex = this.newIndex(shift);

    //get items
    let current = this.getItemByIndex(currentIndex);
    let next = this.getItemByIndex(newIndex);

    // get positions
    let direction = this.get('direction');
    let currentPosition = current.get(direction);
    let nextPosition = next.get(direction);

    // do the shifting
    current.set(direction, nextPosition + shift);
    next.set(direction, currentPosition);

    // update the sort
    this.update();

    // update current index
    this.set('_currentIndex', newIndex);
  }

});
