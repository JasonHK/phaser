/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
 */

var CollisionInfo = require('./CollisionInfo');
var CONST = require('./const');

/**
 * Takes a CollisionInfo object and tests to see if the two bodies are still intersecting / touching.
 *
 * @function Phaser.Physics.Arcade.CheckOverlapY
 * @since 3.17.0
 *
 * @param {Phaser.Physics.Arcade.Body} body1 - The first Body to separate.
 * @param {Phaser.Physics.Arcade.Body} body2 - The second Body to separate.
 *
 * @return {boolean} 
 */
var CheckOverlapY = function (body, collisionInfo)
{
    collisionInfo = CollisionInfo.update(collisionInfo);

    var face = collisionInfo.face;
    var body1 = collisionInfo.body1;
    var body2 = collisionInfo.body2;

    if (face === CONST.FACING_UP)
    {
        // console.log('CheckOverlapY topFace from', body.gameObject.name, 'body1 is', body1.gameObject.name, 'touching', collisionInfo.touching, 'inter', collisionInfo.intersects, 'oy', collisionInfo.overlapY);
        // console.log('body1', body1.x, body1.right, body1.y, body1.bottom, 'body2', body2.x, body2.right, body2.y, body2.bottom);

        body1.setTouchingUp();
        body2.setTouchingDown();

        body1.setBlockedUp();
        body2.setBlockedDown();
    }
    else if (face === CONST.FACING_DOWN)
    {
        // console.log('CheckOverlapY bottomFace from', body.gameObject.name, 'body1 is', body1.gameObject.name);

        body1.setTouchingDown();
        body2.setTouchingUp();

        body1.setBlockedDown();
        body2.setBlockedUp();
    }

    return collisionInfo.touching;
};

module.exports = CheckOverlapY;
