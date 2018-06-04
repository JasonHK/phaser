/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2018 Photon Storm Ltd.
 * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
 */

var Class = require('../../utils/Class');
var EventEmitter = require('eventemitter3');
var Key = require('./keys/Key');
var KeyCodes = require('./keys/KeyCodes');
var KeyCombo = require('./combo/KeyCombo');
var KeyMap = require('./keys/KeyMap');
var ProcessKeyDown = require('./keys/ProcessKeyDown');
var ProcessKeyUp = require('./keys/ProcessKeyUp');

/**
 * @callback KeyboardHandler
 *
 * @property {KeyboardEvent} event - [description]
 */

/**
 * @classdesc
 * The Keyboard Manager is a helper class that belongs to the Input Manager.
 * 
 * Its role is to listen for native DOM Keyboard Events and then process them.
 * 
 * You do not need to create this class directly, the Input Manager will create an instance of it automatically.
 * 
 * You can access it from within a Scene using `this.input.keyboard`. For example, you can do:
 *
 * ```javascript
 * this.input.keyboard.on('keydown', callback, context);
 * ```
 *
 * Or, to listen for a specific key:
 * 
 * ```javascript
 * this.input.keyboard.on('keydown_A', callback, context);
 * ```
 *
 * You can also create Key objects, which you can then poll in your game loop:
 *
 * ```javascript
 * var spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
 * ```
 *
 * _Note_: Many keyboards are unable to process certain combinations of keys due to hardware limitations known as ghosting.
 * See http://www.html5gamedevs.com/topic/4876-impossible-to-use-more-than-2-keyboard-input-buttons-at-the-same-time/ for more details.
 *
 * Also please be aware that certain browser extensions can disable or override Phaser keyboard handling.
 * For example the Chrome extension vimium is known to disable Phaser from using the D key, while EverNote disables the backtick key.
 * And there are others. So, please check your extensions before opening Phaser issues about keys that don't work.
 *
 * @class KeyboardManager
 * @extends Phaser.Events.EventEmitter
 * @memberOf Phaser.Input.Keyboard
 * @constructor
 * @since 3.0.0
 *
 * @param {Phaser.Input.InputManager} inputManager - A reference to the Input Manager.
 */
var KeyboardManager = new Class({

    Extends: EventEmitter,

    initialize:

    function KeyboardManager (inputManager)
    {
        EventEmitter.call(this);

        /**
         * A reference to the Input Manager.
         *
         * @name Phaser.Input.Keyboard.KeyboardManager#manager
         * @type {Phaser.Input.InputManager}
         * @since 3.0.0
         */
        this.manager = inputManager;

        /**
         * A boolean that controls if the Keyboard Manager is enabled or not.
         * Can be toggled on the fly.
         *
         * @name Phaser.Input.Keyboard.KeyboardManager#enabled
         * @type {boolean}
         * @default false
         * @since 3.0.0
         */
        this.enabled = false;

        /**
         * The Keyboard Event target, as defined in the Game Config.
         * Typically the browser window, but can be any interactive DOM element.
         *
         * @name Phaser.Input.Keyboard.KeyboardManager#target
         * @type {any}
         * @since 3.0.0
         */
        this.target;

        /**
         * An array of Key objects to process.
         *
         * @name Phaser.Input.Keyboard.KeyboardManager#keys
         * @type {Phaser.Input.Keyboard.Key[]}
         * @since 3.0.0
         */
        this.keys = [];

        /**
         * An array of KeyCombo objects to process.
         *
         * @name Phaser.Input.Keyboard.KeyboardManager#combos
         * @type {Phaser.Input.Keyboard.KeyCombo[]}
         * @since 3.0.0
         */
        this.combos = [];

        /**
         * [description]
         *
         * @name Phaser.Input.Keyboard.KeyboardManager#queue
         * @type {KeyboardEvent[]}
         * @private
         * @since 3.0.0
         */
        this.queue = [];

        inputManager.events.once('boot', this.boot, this);
    },

    /**
     * The Boot handler is called by Phaser.Game when it first starts up.
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#boot
     * @private
     * @since 3.0.0
     */
    boot: function ()
    {
        var config = this.manager.config;

        this.enabled = config.inputKeyboard;
        this.target = config.inputKeyboardEventTarget;

        if (this.enabled)
        {
            this.startListeners();
        }
    },

    /**
     * The Keyboard Down Event Handler.
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#onKeyDown
     * @since 3.10.0
     *
     * @param {KeyboardEvent} event - The native DOM Keyboard Event.
     */
    onKeyDown: function (event)
    {
        if (event.defaultPrevented || !this.enabled)
        {
            // Do nothing if event already handled
            return;
        }

        this.queue.push(event);

        var key = this.keys[event.keyCode];

        if (key && key.preventDefault)
        {
            event.preventDefault();
        }
    },

    /**
     * The Keyboard Up Event Handler.
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#onKeyUp
     * @since 3.10.0
     *
     * @param {KeyboardEvent} event - The native DOM Keyboard Event.
     */
    onKeyUp: function (event)
    {
        if (event.defaultPrevented || !this.enabled)
        {
            // Do nothing if event already handled
            return;
        }

        this.queue.push(event);

        var key = this.keys[event.keyCode];

        if (key && key.preventDefault)
        {
            event.preventDefault();
        }
    },

    /**
     * [description]
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#startListeners
     * @since 3.0.0
     */
    startListeners: function ()
    {
        this.target.addEventListener('keydown', this.onKeyDown.bind(this), false);
        this.target.addEventListener('keyup', this.onKeyUp.bind(this), false);

        //  Finally, listen for an update event from the Input Manager
        this.manager.events.on('update', this.update, this);
    },

    /**
     * [description]
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#stopListeners
     * @since 3.0.0
     */
    stopListeners: function ()
    {
        this.target.removeEventListener('keydown', this.onKeyDown);
        this.target.removeEventListener('keyup', this.onKeyUp);

        this.manager.events.off('update', this.update);
    },

    /**
     * @typedef {object} CursorKeys
     *
     * @property {Phaser.Input.Keyboard.Key} [up] - A Key object mapping to the UP arrow key.
     * @property {Phaser.Input.Keyboard.Key} [down] - A Key object mapping to the DOWN arrow key.
     * @property {Phaser.Input.Keyboard.Key} [left] - A Key object mapping to the LEFT arrow key.
     * @property {Phaser.Input.Keyboard.Key} [right] - A Key object mapping to the RIGHT arrow key.
     * @property {Phaser.Input.Keyboard.Key} [space] - A Key object mapping to the SPACE BAR key.
     * @property {Phaser.Input.Keyboard.Key} [shift] - A Key object mapping to the SHIFT key.
     */

    /**
     * Creates and returns an object containing 4 hotkeys for Up, Down, Left and Right, and also Space Bar and shift.
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#createCursorKeys
     * @since 3.0.0
     *
     * @return {CursorKeys} An object containing the properties: `up`, `down`, `left`, `right`, `space` and `shift`.
     */
    createCursorKeys: function ()
    {
        return this.addKeys({
            up: KeyCodes.UP,
            down: KeyCodes.DOWN,
            left: KeyCodes.LEFT,
            right: KeyCodes.RIGHT,
            space: KeyCodes.SPACE,
            shift: KeyCodes.SHIFT
        });
    },

    /**
     * A practical way to create an object containing user selected hotkeys.
     *
     * For example,
     *
     *     addKeys({ 'up': Phaser.Input.Keyboard.KeyCodes.W, 'down': Phaser.Input.Keyboard.KeyCodes.S });
     *
     * would return an object containing properties (`up` and `down`) referring to {@link Phaser.Input.Keyboard.Key} objects.
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#addKeys
     * @since 3.0.0
     *
     * @param {object} keys - [description]
     *
     * @return {object} [description]
     */
    addKeys: function (keys)
    {
        var output = {};

        for (var key in keys)
        {
            output[key] = this.addKey(keys[key]);
        }

        return output;
    },

    /**
     * If you need more fine-grained control over a Key you can create a new Phaser.Key object via this method.
     * The Key object can then be polled, have events attached to it, etc.
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#addKey
     * @since 3.0.0
     *
     * @param {(string|integer)} keyCode - [description]
     *
     * @return {Phaser.Input.Keyboard.Key} [description]
     */
    addKey: function (keyCode)
    {
        var keys = this.keys;

        if (typeof keyCode === 'string')
        {
            keyCode = keyCodes[keyCode.toUpperCase()];
        }

        if (!keys[keyCode])
        {
            keys[keyCode] = new Key(keyCode);

            // this.captures[keyCode] = true;
        }

        return keys[keyCode];
    },

    /**
     * Removes a Key object from the Keyboard manager.
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#removeKey
     * @since 3.0.0
     *
     * @param {(string|integer)} keyCode - [description]
     */
    removeKey: function (keyCode)
    {
        if (this.keys[keyCode])
        {
            this.keys[keyCode] = undefined;
            // this.captures[keyCode] = false;
        }
    },

    /**
     * [description]
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#addKeyCapture
     * @since 3.0.0
     *
     * @param {(string|integer|string[]|integer[])} keyCodes - [description]
     */
    addKeyCapture: function (keyCodes)
    {
        if (!Array.isArray(keyCodes))
        {
            keyCodes = [ keyCodes ];
        }

        for (var i = 0; i < keyCodes.length; i++)
        {
            this.captures[keyCodes[i]] = true;
        }
    },

    /**
     * [description]
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#removeKeyCapture
     * @since 3.0.0
     *
     * @param {(string|integer|string[]|integer[])} keyCodes - [description]
     */
    removeKeyCapture: function (keyCodes)
    {
        if (!Array.isArray(keyCodes))
        {
            keyCodes = [ keyCodes ];
        }

        for (var i = 0; i < keyCodes.length; i++)
        {
            this.captures[keyCodes[i]] = false;
        }
    },

    /**
     * [description]
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#createCombo
     * @since 3.0.0
     *
     * @param {(string|integer[]|object[])} keys - [description]
     * @param {KeyComboConfig} config - [description]
     *
     * @return {Phaser.Input.Keyboard.KeyCombo} [description]
     */
    createCombo: function (keys, config)
    {
        return new KeyCombo(this, keys, config);
    },

    /**
     * [description]
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#update
     * @since 3.0.0
     */
    update: function ()
    {
        var len = this.queue.length;

        if (!this.enabled || len === 0)
        {
            return;
        }

        //  Clears the queue array, and also means we don't work on array data that could potentially
        //  be modified during the processing phase
        var queue = this.queue.splice(0, len);

        var keys = this.keys;

        //  Process the event queue, dispatching all of the events that have stored up
        for (var i = 0; i < len; i++)
        {
            var event = queue[i];
            var code = event.keyCode;

            if (event.type === 'keydown')
            {
                if (KeyMap[code] && (keys[code] === undefined || keys[code].isDown === false))
                {
                    //  Will emit a keyboard or keyup event
                    this.emit(event.type, event);

                    this.emit('keydown_' + KeyMap[code], event);
                }

                if (keys[code])
                {
                    ProcessKeyDown(keys[code], event);
                }
            }
            else
            {
                //  Will emit a keyboard or keyup event
                this.emit(event.type, event);

                this.emit('keyup_' + KeyMap[code], event);

                if (keys[code])
                {
                    ProcessKeyUp(keys[code], event);
                }
            }
        }
    },

    /**
     * [description]
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#shutdown
     * @since 3.0.0
     */
    shutdown: function ()
    {
        this.removeAllListeners();
    },

    /**
     * [description]
     *
     * @method Phaser.Input.Keyboard.KeyboardManager#destroy
     * @since 3.0.0
     */
    destroy: function ()
    {
        this.stopListeners();

        this.removeAllListeners();

        this.keys = [];
        this.combos = [];
        this.captures = [];
        this.queue = [];
        this.handler = undefined;

        this.manager = null;
    }

});

module.exports = KeyboardManager;
