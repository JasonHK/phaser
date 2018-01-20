var Class = require('../../utils/Class');
var EventEmitter = require('eventemitter3');
var NoAudioSoundManager = new Class({
    Extends: EventEmitter,
    initialize: function NoAudioSoundManager(game) {
        EventEmitter.call(this);
        this.game = game;
        this.sounds = [];
        this.mute = false;
        this.volume = 1;
    }
});
module.exports = NoAudioSoundManager;
