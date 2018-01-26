var Class = require('../utils/Class');
var NOOP = require('../utils/NOOP');
var EventEmitter = require('eventemitter3');
/*!
 * @author Pavle Goloskokovic <pgoloskokovic@gmail.com> (http://prunegames.com)
 */
var BaseSoundManager = new Class({
    Extends: EventEmitter,
    /**
     * The sound manager is responsible for playing back audio via Web Audio API or HTML Audio tag as fallback.
     * The audio file type and the encoding of those files are extremely important.
     * Not all browsers can play all audio formats.
     * There is a good guide to what's supported [here](https://developer.mozilla.org/en-US/Apps/Fundamentals/Audio_and_video_delivery/Cross-browser_audio_basics#Audio_Codec_Support).
     *
     * @class Phaser.Sound.BaseSoundManager
     * @constructor
     * @param {Phaser.Game} game - Reference to the current game instance.
     */
    initialize: function BaseSoundManager(game) {
        EventEmitter.call(this);
        /**
         * Local reference to game.
         *
         * @readonly
         * @property {Phaser.Game} game
         */
        this.game = game;
        /**
         * An array containing all added sounds.
         *
         * @private
         * @property {ISound[]} sounds
         * @default []
         */
        this.sounds = [];
        /**
         * Global mute setting.
         *
         * @property {boolean} mute
         * @default false
         */
        this.mute = false;
        /**
         * Global volume setting.
         *
         * @property {number} volume
         * @default 1
         */
        this.volume = 1;
        /**
         * Global playback rate at which all the sounds will be played.
         * Value of 1.0 plays the audio at full speed, 0.5 plays the audio at half speed
         * and 2.0 doubles the audio's playback speed.
         *
         * @property {number} rate
         * @default 1
         */
        this.rate = 1;
        /**
         * Global detuning of all sounds in [cents](https://en.wikipedia.org/wiki/Cent_%28music%29).
         * The range of the value is -1200 to 1200, but we recommend setting it to [50](https://en.wikipedia.org/wiki/50_Cent).
         *
         * @property {number} detune
         * @default 0
         */
        this.detune = 0;
        /**
         * Flag indicating if sounds should be paused when game looses focus,
         * for instance when user switches to another tab/program/app.
         *
         * @property {boolean} pauseOnBlur
         * @default true
         */
        this.pauseOnBlur = true;
        game.events.on('blur', function () {
            if (this.pauseOnBlur) {
                this.onBlur();
            }
        }, this);
        game.events.on('focus', function () {
            if (this.pauseOnBlur) {
                this.onFocus();
            }
        }, this);
        /**
         * Property that actually holds the value of global playback rate.
         *
         * @private
         * @property {number} _rate
         * @default 1
         */
        this._rate = 1;
        /**
         * Property that actually holds the value of global detune.
         *
         * @private
         * @property {number} _detune
         * @default 0
         */
        this._detune = 0;
        /**
         * Mobile devices require sounds to be triggered from an explicit user action,
         * such as a tap, before any sound can be loaded/played on a web page.
         * Set to true if the audio system is currently locked awaiting user interaction.
         *
         * @readonly
         * @property {boolean} locked
         */
        this.locked = this.locked || false;
        /**
         * Flag used internally for handling when the audio system
         * has been unlocked, if there ever was a need for it.
         *
         * @private
         * @property {boolean} unlocked
         * @default false
         */
        this.unlocked = false;
        if (this.locked) {
            this.unlock();
        }
    },
    /**
     * Adds a new sound into the sound manager.
     *
     * @override
     * @method Phaser.Sound.BaseSoundManager#add
     * @param {string} key - Asset key for the sound.
     * @param {ISoundConfig} [config] - An optional config object containing default sound settings.
     * @returns {ISound} The new sound instance.
     */
    add: NOOP,
    /**
     * Adds a new audio sprite sound into the sound manager.
     *
     * @method Phaser.Sound.BaseSoundManager#addAudioSprite
     * @param {string} key - Asset key for the sound.
     * @param {ISoundConfig} [config] - An optional config object containing default sound settings.
     * @returns {IAudioSpriteSound} The new audio sprite sound instance.
     */
    addAudioSprite: function (key, config) {
        var sound = this.add(key, config);
        /**
         * Local reference to 'spritemap' object form json file generated by audiosprite tool.
         *
         * @property {object} spritemap
         */
        sound.spritemap = this.game.cache.json.get(key).spritemap;
        for (var markerName in sound.spritemap) {
            if (!sound.spritemap.hasOwnProperty(markerName)) {
                continue;
            }
            var marker = sound.spritemap[markerName];
            sound.addMarker({
                name: markerName,
                start: marker.start,
                duration: marker.end - marker.start,
                config: config
            });
        }
        return sound;
    },
    /**
     * Enables playing sound on the fly without the need to keep a reference to it.
     * Sound will auto destroy once its playback ends.
     *
     * @method Phaser.Sound.BaseSoundManager#play
     * @param {string} key - Asset key for the sound.
     * @param {ISoundConfig | ISoundMarker} [extra] - An optional additional object containing settings to be applied to the sound. It could be either config or marker object.
     * @returns {boolean} Whether the sound started playing successfully.
     */
    play: function (key, extra) {
        var sound = this.add(key);
        // TODO document all events
        sound.once('ended', sound.destroy, sound);
        if (extra) {
            if (extra.name) {
                sound.addMarker(extra);
                return sound.play(extra.name);
            }
            else {
                return sound.play(extra);
            }
        }
        else {
            return sound.play();
        }
    },
    /**
     * Enables playing audio sprite sound on the fly without the need to keep a reference to it.
     * Sound will auto destroy once its playback ends.
     *
     * @method Phaser.Sound.BaseSoundManager#playAudioSprite
     * @param {string} key - Asset key for the sound.
     * @param {string} spriteName - The name of the sound sprite to play.
     * @param {ISoundConfig} [config] - An optional config object containing default sound settings.
     * @returns {boolean} Whether the audio sprite sound started playing successfully.
     */
    playAudioSprite: function (key, spriteName, config) {
        var sound = this.addAudioSprite(key);
        sound.once('ended', sound.destroy, sound);
        return sound.play(spriteName, config);
    },
    /**
     * Removes a sound from the sound manager.
     * The removed sound is destroyed before removal.
     *
     * @method Phaser.Sound.BaseSoundManager#remove
     * @param {ISound} sound - The sound object to remove.
     * @returns {boolean} True if the sound was removed successfully, otherwise false.
     */
    remove: function (sound) {
        var index = this.sounds.indexOf(sound);
        if (index !== -1) {
            sound.destroy();
            this.sounds.splice(index, 1);
            return true;
        }
        return false;
    },
    /**
     * Removes all sounds from the sound manager that have an asset key matching the given value.
     * The removed sounds are destroyed before removal.
     *
     * @method Phaser.Sound.BaseSoundManager#removeByKey
     * @param {string} key - The key to match when removing sound objects.
     * @returns {number} The number of matching sound objects that were removed.
     */
    removeByKey: function (key) {
        var removed = 0;
        for (var i = this.sounds.length - 1; i >= 0; i--) {
            var sound = this.sounds[i];
            if (sound.key === key) {
                sound.destroy();
                this.sounds.splice(i, 1);
                removed++;
            }
        }
        return removed;
    },
    /**
     * Pauses all the sounds in the game.
     *
     * @method Phaser.Sound.BaseSoundManager#pauseAll
     */
    pauseAll: function () {
        this.forEachActiveSound(function (sound) {
            sound.pause();
        });
        /**
         * @event Phaser.Sound.BaseSoundManager#pauseall
         * @param {Phaser.Sound.BaseSoundManager} soundManager - Reference to the sound manager that emitted event.
         */
        this.emit('pauseall', this);
    },
    /**
     * Resumes all the sounds in the game.
     *
     * @method Phaser.Sound.BaseSoundManager#resumeAll
     */
    resumeAll: function () {
        this.forEachActiveSound(function (sound) {
            sound.resume();
        });
        /**
         * @event Phaser.Sound.BaseSoundManager#resumeall
         * @param {Phaser.Sound.BaseSoundManager} soundManager - Reference to the sound manager that emitted event.
         */
        this.emit('resumeall', this);
    },
    /**
     * Stops all the sounds in the game.
     *
     * @method Phaser.Sound.BaseSoundManager#stopAll
     */
    stopAll: function () {
        this.forEachActiveSound(function (sound) {
            sound.stop();
        });
        this.emit('stopall', this);
    },
    /**
     * Method used internally for unlocking audio playback on devices that
     * require user interaction before any sound can be played on a web page.
     *
     * Read more about how this issue is handled here in [this article](https://medium.com/@pgoloskokovic/unlocking-web-audio-the-smarter-way-8858218c0e09).
     *
     * @override
     * @protected
     * @method Phaser.Sound.BaseSoundManager#unlock
     */
    unlock: NOOP,
    /**
     * Method used internally for pausing sound manager if
     * Phaser.Sound.BaseSoundManager#pauseOnBlur is set to true.
     *
     * @override
     * @protected
     * @method Phaser.Sound.BaseSoundManager#onBlur
     */
    onBlur: NOOP,
    /**
     * Method used internally for resuming sound manager if
     * Phaser.Sound.BaseSoundManager#pauseOnBlur is set to true.
     *
     * @override
     * @protected
     * @method Phaser.Sound.BaseSoundManager#onFocus
     */
    onFocus: NOOP,
    /**
     * Update method called on every game step.
     * Removes destroyed sounds and updates every active sound in the game.
     *
     * @protected
     * @method Phaser.Sound.BaseSoundManager#update
     * @param {number} time - The current timestamp as generated by the Request Animation Frame or SetTimeout.
     * @param {number} delta - The delta time elapsed since the last frame.
     */
    update: function (time, delta) {
        if (this.unlocked) {
            this.unlocked = false;
            this.locked = false;
            this.emit('unlocked', this);
        }
        for (var i = this.sounds.length - 1; i >= 0; i--) {
            if (this.sounds[i].pendingRemove) {
                this.sounds.splice(i, 1);
            }
        }
        this.sounds.forEach(function (sound) {
            sound.update(time, delta);
        });
    },
    /**
     * Destroys all the sounds in the game and all associated events.
     *
     * @method Phaser.Sound.BaseSoundManager#destroy
     */
    destroy: function () {
        this.game = null;
        this.removeAllListeners();
        this.forEachActiveSound(function (sound) {
            sound.destroy();
        });
        this.sounds.length = 0;
        this.sounds = null;
    },
    /**
     * Method used internally for iterating only over active sounds and skipping sounds that are marked for removal.
     *
     * @private
     * @method Phaser.Sound.BaseSoundManager#forEachActiveSound
     * @param {(sound: ISound, index: number, array: ISound[]) => void} callbackfn - Callback function.
     * @param [thisArg=this] - Callback context.
     */
    forEachActiveSound: function (callbackfn, thisArg) {
        var _this = this;
        this.sounds.forEach(function (sound, index) {
            if (!sound.pendingRemove) {
                callbackfn.call(thisArg || _this, sound, index, _this.sounds);
            }
        });
    }
});
/**
 * Global playback rate.
 *
 * @name Phaser.Sound.BaseSoundManager#rate
 * @property {number} rate
 */
Object.defineProperty(BaseSoundManager.prototype, 'rate', {
    get: function () {
        return this._rate;
    },
    set: function (value) {
        this._rate = value;
        this.forEachActiveSound(function (sound) {
            sound.setRate();
        });
        this.emit('rate', this, value);
    }
});
/**
 * Global detune.
 *
 * @name Phaser.Sound.BaseSoundManager#detune
 * @property {number} detune
 */
Object.defineProperty(BaseSoundManager.prototype, 'detune', {
    get: function () {
        return this._detune;
    },
    set: function (value) {
        this._detune = value;
        this.forEachActiveSound(function (sound) {
            sound.setRate();
        });
        this.emit('detune', this, value);
    }
});
module.exports = BaseSoundManager;
