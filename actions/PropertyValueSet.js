/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2018 Photon Storm Ltd.
 * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
 */

/**
 * Takes an array of Game Objects, or any objects that have a public property as defined in `key`,
 * and then sets it to the given value.
 * 
 * The optional `step` property is applied incrementally, multiplied by each item in the array.
 * 
 * To use this with a Group: `PropertyValueSet(group.getChildren(), key, value, step)`
 *
 * @function Phaser.Actions.PropertyValueSet
 * @since 3.3.0
 * 
 * @param {array|Phaser.GameObjects.GameObject[]} items - The array of items to be updated by this action.
 * @param {string} key - The property to be updated.
 * @param {number} value - The amount to set the property to.
 * @param {number} [step=0] - This is added to the `value` amount, multiplied by the iteration counter.
 * @param {integer} [index=0] - An optional offset to start searching from within the items array.
 * @param {integer} [direction=1] - The direction to iterate through the array. 1 is from beginning to end, -1 from end to beginning.
 *
 * @return {array} The array of objects that were passed to this Action.
 */
var PropertyValueSet = function (items, key, value, step, index, direction)
{
    if (step === undefined) { step = 0; }
    if (index === undefined) { index = 0; }
    if (direction === undefined) { direction = 1; }

    var i;
    var t = 0;
    var end = items.length;

    if (direction === 1)
    {
        //  Start to End
        for (i = index; i < end; i++)
        {
            items[i][key] = value + (t * step);
            t++;
        }
    }
    else
    {
        //  End to Start
        for (i = index; i >= 0; i--)
        {
            items[i][key] = value + (t * step);
            t++;
        }
    }

    return items;
};

module.exports = PropertyValueSet;
