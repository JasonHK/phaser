/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2019 Photon Storm Ltd.
 * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
 */

var Bounds = require('./lib/geometry/Bounds');
var Class = require('../../utils/Class');
var Composite = require('./lib/body/Composite');
var Constraint = require('./lib/constraint/Constraint');
var Detector = require('./lib/collision/Detector');
var Events = require('./events');
var GetFastValue = require('../../utils/object/GetFastValue');
var InputEvents = require('../../input/events');
var Merge = require('../../utils/object/Merge');
var Sleeping = require('./lib/core/Sleeping');
var Vector2 = require('../../math/Vector2');
var Vertices = require('./lib/geometry/Vertices');

/**
 * @classdesc
 * A Pointer Constraint is a special type of constraint that allows you to click
 * and drag bodies in a Matter World. It monitors the active Pointers in a Scene,
 * and when one is pressed down it checks to see if that hit any part of any active
 * body in the world. If it did, and the body has input enabled, it will begin to
 * drag it until either released, or you stop it via the `stopDrag` method.
 * 
 * You can adjust the stiffness, length and other properties of the constraint via
 * the `options` object on creation.
 *
 * @class PointerConstraint
 * @memberof Phaser.Physics.Matter
 * @constructor
 * @since 3.0.0
 *
 * @param {Phaser.Scene} scene - A reference to the Scene to which this Pointer Constraint belongs.
 * @param {Phaser.Physics.Matter.World} world - A reference to the Matter World instance to which this Constraint belongs.
 * @param {object} [options] - A Constraint configuration object.
 */
var PointerConstraint = new Class({

    initialize:

    function PointerConstraint (scene, world, options)
    {
        if (options === undefined) { options = {}; }

        //  Defaults
        var defaults = {
            label: 'Pointer Constraint',
            pointA: { x: 0, y: 0 },
            pointB: { x: 0, y: 0 },
            damping: 0,
            length: 0.01,
            stiffness: 0.1,
            angularStiffness: 1,
            collisionFilter: {
                category: 0x0001,
                mask: 0xFFFFFFFF,
                group: 0
            }
        };

        /**
         * A reference to the Scene to which this Pointer Constraint belongs.
         * This is the same Scene as the Matter World instance.
         *
         * @name Phaser.Physics.Matter.PointerConstraint#scene
         * @type {Phaser.Scene}
         * @since 3.0.0
         */
        this.scene = scene;

        /**
         * A reference to the Matter World instance to which this Constraint belongs.
         *
         * @name Phaser.Physics.Matter.PointerConstraint#world
         * @type {Phaser.Physics.Matter.World}
         * @since 3.0.0
         */
        this.world = world;

        /**
         * The Camera the Pointer was interacting with when the input
         * down event was processed.
         *
         * @name Phaser.Physics.Matter.PointerConstraint#camera
         * @type {Phaser.Cameras.Scene2D.Camera}
         * @since 3.0.0
         */
        this.camera = null;

        /**
         * A reference to the Input Pointer that activated this Constraint.
         * This is set in the `onDown` handler.
         *
         * @name Phaser.Physics.Matter.PointerConstraint#pointer
         * @type {Phaser.Input.Pointer}
         * @default null
         * @since 3.0.0
         */
        this.pointer = null;

        /**
         * Is this Constraint active or not?
         * 
         * An active constraint will be processed each update. An inactive one will be skipped.
         * Use this to toggle a Pointer Constraint on and off.
         *
         * @name Phaser.Physics.Matter.PointerConstraint#active
         * @type {boolean}
         * @default true
         * @since 3.0.0
         */
        this.active = true;

        /**
         * The internal transformed position.
         *
         * @name Phaser.Physics.Matter.PointerConstraint#position
         * @type {Phaser.Math.Vector2}
         * @since 3.0.0
         */
        this.position = new Vector2();

        /**
         * The body that is currently being dragged, if any.
         *
         * @name Phaser.Physics.Matter.PointerConstraint#body
         * @type {?MatterJS.Body}
         * @since 3.16.2
         */
        this.body = null;

        /**
         * The part of the body that was clicked on to start the drag.
         *
         * @name Phaser.Physics.Matter.PointerConstraint#part
         * @type {?MatterJS.Body}
         * @since 3.16.2
         */
        this.part = null;

        /**
         * The native Matter Constraint that is used to attach to bodies.
         *
         * @name Phaser.Physics.Matter.PointerConstraint#constraint
         * @type {object}
         * @since 3.0.0
         */
        this.constraint = Constraint.create(Merge(options, defaults));

        this.world.on(Events.BEFORE_UPDATE, this.update, this);

        scene.sys.input.on(InputEvents.POINTER_DOWN, this.onDown, this);
    },

    /**
     * A Pointer has been pressed down onto the Scene.
     * 
     * If this Constraint doesn't have an active Pointer then a hit test is
     * run against all active bodies in the world. If one is found it is bound
     * to this constraint and the drag begins.
     *
     * @method Phaser.Physics.Matter.PointerConstraint#onDown
     * @fires Phaser.Physics.Matter.Events#DRAG_START
     * @since 3.0.0
     *
     * @param {Phaser.Input.Pointer} pointer - A reference to the Pointer that was pressed.
     */
    onDown: function (pointer)
    {
        if (!this.pointer)
        {
            if (this.getBody(pointer))
            {
                this.pointer = pointer;

                this.camera = pointer.camera;
            }
        }
    },

    /**
     * Scans all active bodies in the current Matter World to see if any of them
     * are hit by the Pointer. The _first one_ found to hit is set as the active contraint
     * body.
     *
     * @method Phaser.Physics.Matter.PointerConstraint#getBody
     * @since 3.16.2
     * 
     * @return {boolean} `true` if a body was found and set, otherwise `false`.
     */
    getBody: function (pointer)
    {
        var pos = this.position;
        var constraint = this.constraint;

        pointer.camera.getWorldPoint(pointer.x, pointer.y, pos);

        var bodies = Composite.allBodies(this.world.localWorld);

        for (var i = 0; i < bodies.length; i++)
        {
            var body = bodies[i];

            if (!body.ignorePointer &&
                Bounds.contains(body.bounds, pos) &&
                Detector.canCollide(body.collisionFilter, constraint.collisionFilter))
            {
                if (this.hitTestBody(body, pos))
                {
                    this.world.emit(Events.DRAG_START, this.body, this.part, this);

                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Scans the current body to determine if a part of it was clicked on.
     * If a part is found the body is set as the `constraint.bodyB` property,
     * as well as the `body` property of this class. The part is also set.
     *
     * @method Phaser.Physics.Matter.PointerConstraint#hitTestBody
     * @since 3.16.2
     *
     * @param {MatterJS.Body} body - The Matter Body to check.
     * @param {Phaser.Math.Vector2} position - A translated hit test position.
     *
     * @return {boolean} `true` if a part of the body was hit, otherwise `false`.
     */
    hitTestBody: function (body, position)
    {
        var constraint = this.constraint;

        var start = (body.parts.length > 1) ? 1 : 0;

        for (var i = start; i < body.parts.length; i++)
        {
            var part = body.parts[i];

            if (Vertices.contains(part.vertices, position))
            {
                constraint.bodyB = body;

                constraint.pointA.x = position.x;
                constraint.pointA.y = position.y;

                constraint.pointB.x = position.x - body.position.x;
                constraint.pointB.y = position.y - body.position.y;

                constraint.angleB = body.angle;

                Sleeping.set(body, false);

                this.part = part;
                this.body = body;

                return true;
            }
        }

        return false;
    },

    /**
     * Internal update handler. Called in the Matter BEFORE_UPDATE step.
     *
     * @method Phaser.Physics.Matter.PointerConstraint#update
     * @fires Phaser.Physics.Matter.Events#DRAG
     * @since 3.0.0
     */
    update: function ()
    {
        var body = this.body;
        var pointer = this.pointer;

        if (!this.active || !pointer || !body)
        {
            return;
        }

        if (pointer.isDown)
        {
            var pos = this.position;
            var constraint = this.constraint;
    
            this.camera.getWorldPoint(pointer.x, pointer.y, pos);
    
            Sleeping.set(body, false);
    
            constraint.pointA.x = pos.x;
            constraint.pointA.y = pos.y;
    
            this.world.emit(Events.DRAG, body, this);
        }
        else
        {
            //  Pointer has been released since the last world step
            this.stopDrag();
        }
    },

    /**
     * Stops the Pointer Constraint from dragging the body any further.
     * 
     * This is called automatically if the Pointer is released while actively
     * dragging a body. Or, you can call it manually to release a body from a
     * constraint without having to first release the pointer.
     *
     * @method Phaser.Physics.Matter.PointerConstraint#stopDrag
     * @fires Phaser.Physics.Matter.Events#DRAG_END
     * @since 3.16.2
     */
    stopDrag: function ()
    {
        var body = this.body;
        var constraint = this.constraint;

        if (body)
        {
            this.world.emit(Events.DRAG_END, body, this);

            this.pointer = null;
            this.body = null;
            this.part = null;

            constraint.bodyB = null;
        }
    },

    /**
     * Destroys this Pointer Constraint instance and all of its references.
     *
     * @method Phaser.Physics.Matter.PointerConstraint#destroy
     * @since 3.0.0
     */
    destroy: function ()
    {
        this.world.removeConstraint(this.constraint);

        this.pointer = null;
        this.constraint = null;
        this.body = null;
        this.part = null;

        this.world.off(Events.BEFORE_UPDATE, this.update);

        this.scene.sys.input.off(InputEvents.POINTER_DOWN, this.onDown, this);
    }

});

module.exports = PointerConstraint;
