/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2018 Photon Storm Ltd.
 * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
 */

/**
 * @namespace Phaser.Game.Events
 */

module.exports = {

    BOOT: require('./BOOT_EVENT'),
    DESTROY: require('./DESTROY_EVENT'),
    PAUSE: require('./PAUSE_EVENT'),
    POST_RENDER: require('./POST_RENDER_EVENT'),
    POST_STEP: require('./POST_STEP_EVENT'),
    PRE_RENDER: require('./PRE_RENDER_EVENT'),
    PRE_STEP: require('./PRE_STEP_EVENT'),
    RESUME: require('./RESUME_EVENT'),
    STEP: require('./STEP_EVENT')

};
