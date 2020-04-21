'use strict';

const Meta = imports.gi.Meta;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Effects = Me.imports.effects;

const EFFECT_NAME = 'wobbly-effect';

var is_managed_op = function (op) {
    return Meta.GrabOp.MOVING == op ||
           Meta.GrabOp.RESIZING_W == op ||
           Meta.GrabOp.RESIZING_E == op ||
           Meta.GrabOp.RESIZING_S == op ||
           Meta.GrabOp.RESIZING_N == op;
}

var get_actor = function(window) {
    if (window) {
        return window.get_compositor_private();
    }
    return null;
}

var get_actor_effect = function (window) {
    if (window) {
        let actor = window.get_compositor_private();
        if (actor) {
            return actor.get_effect(EFFECT_NAME);
        }
    }
    return null;
}

var add_effect = function (window, op) { 
    let actor = get_actor(window);
    if (actor) {
        if (Meta.GrabOp.MOVING == op) {
            actor.add_effect_with_name(EFFECT_NAME, new Effects.WobblyEffect({op: op}));
        } else {
            actor.add_effect_with_name(EFFECT_NAME, new Effects.ResizeEffect({op: op}));
        }
    }
}

var stop_effect = function (window) {
    let effect = get_actor_effect(window);
    if (effect) {
        effect.stop();
    }
}

var destroy_effect = function (window) {
    let effect = get_actor_effect(window);
    if (effect) {
        effect.destroy();
    }
}

var destroy_actor_effect = function (actor) {
    if (actor) {
        let effect = actor.get_effect(EFFECT_NAME);
        if (effect) {
            effect.destroy();
        }
    }
}