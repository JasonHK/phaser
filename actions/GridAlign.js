/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
 */

var AlignIn = require('../display/align/in/QuickSet');
var CONST = require('../display/align/const');
var GetFastValue = require('../utils/object/GetFastValue');
var NOOP = require('../utils/NOOP');
var Zone = require('../gameobjects/zone/Zone');

var tempZone = new Zone({ sys: { queueDepthSort: NOOP, events: { once: NOOP } } }, 0, 0, 1, 1);

/**
 * Takes an array of Game Objects, or any objects that have public `x` and `y` properties,
 * and then aligns them based on the grid configuration given to this action.
 *
 * @function Phaser.Actions.GridAlign
 * @since 3.0.0
 *
 * @generic {Phaser.GameObjects.GameObject[]} G - [items,$return]
 *
 * @param {(array|Phaser.GameObjects.GameObject[])} items - The array of items to be updated by this action.
 * @param {Phaser.Types.Actions.GridAlignConfig} options - The GridAlign Configuration object.
 *
 * @return {(array|Phaser.GameObjects.GameObject[])} The array of objects that were passed to this Action.
 */
var GridAlign = function (items, options)
{
    if (options === undefined) { options = {}; }

    var width = GetFastValue(options, 'width', -1);
    var height = GetFastValue(options, 'height', -1);
    var cellWidth = GetFastValue(options, 'cellWidth', 1);
    var cellHeight = GetFastValue(options, 'cellHeight', cellWidth);
    var position = GetFastValue(options, 'position', CONST.TOP_LEFT);
    var x = GetFastValue(options, 'x', 0);
    var y = GetFastValue(options, 'y', 0);

    var cx = 0;
    var cy = 0;
    var w = (width * cellWidth);
    var h = (height * cellHeight);

    tempZone.setPosition(x, y);
    tempZone.setSize(cellWidth, cellHeight);

    for (var i = 0; i < items.length; i++)
    {
        AlignIn(items[i], tempZone, position);

        if (width === -1)
        {
            //  We keep laying them out horizontally until we've done them all
            cy += cellHeight;
            tempZone.y += cellHeight;

            if (cy === h)
            {
                cy = 0;
                tempZone.x += cellWidth;
                tempZone.y = y;
            }
        }
        else if (height === -1)
        {
            //  We keep laying them out vertically until we've done them all
            cx += cellWidth;
            tempZone.x += cellWidth;

            if (cx === w)
            {
                cx = 0;
                tempZone.x = x;
                tempZone.y += cellHeight;
            }
        }
        else
        {
            //  We keep laying them out until we hit the column limit
            cx += cellWidth;
            tempZone.x += cellWidth;

            if (cx === w)
            {
                cx = 0;
                cy += cellHeight;
                tempZone.x = x;
                tempZone.y += cellHeight;

                if (cy === h)
                {
                    //  We've hit the column limit, so return, even if there are items left
                    break;
                }
            }
        }
    }

    return items;
};

module.exports = GridAlign;
