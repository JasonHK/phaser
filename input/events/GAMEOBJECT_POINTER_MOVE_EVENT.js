/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
 */

/**
 * The Game Object Pointer Move Event.
 * 
 * This event is dispatched by an interactive Game Object if a pointer is moved while over it.
 * 
 * Listen to this event from a Game Object using: `gameObject.on('pointermove', listener)`.
 * Note that the scope of the listener is automatically set to be the Game Object instance itself.
 * 
 * To receive this event, the Game Object must have been set as interactive.
 * See [GameObject.setInteractive]{Phaser.GameObjects.GameObject#setInteractive} for more details.
 * 
 * The event hierarchy is as follows:
 * 
 * 1) GAMEOBJECT_POINTER_MOVE
 * 2) GAMEOBJECT_MOVE
 * 3) POINTER_MOVE
 * 
 * With the top event being dispatched first and then flowing down the list. Note that higher-up event handlers can stop
 * the propagation of this event.
 *
 * @event Phaser.Input.Events#GAMEOBJECT_POINTER_MOVE
 * 
 * @param {Phaser.Input.Pointer} pointer - The Pointer responsible for triggering this event.
 * @param {number} localX - The x coordinate that the Pointer interacted with this object on, relative to the Game Object's top-left position.
 * @param {number} localY - The y coordinate that the Pointer interacted with this object on, relative to the Game Object's top-left position.
 * @param {Phaser.Input.EventData} event - The Phaser input event. You can call `stopPropagation()` to halt it from going any further in the event flow.
 */
module.exports = 'pointermove';
