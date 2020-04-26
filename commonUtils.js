'use strict';

const Meta = imports.gi.Meta;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Effects = Me.imports.effects;

const EFFECT_NAME = 'wobbly-effect';
const MIN_MAX_EFFECT_NAME = 'min-max-wobbly-effect';

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

var add_actor_wobbly_effect = function (actor, op) { 
    if (actor) {
        if (Meta.GrabOp.MOVING == op) {
            actor.add_effect_with_name(EFFECT_NAME, new Effects.WobblyEffect({op: op}));
        } else {
            actor.add_effect_with_name(EFFECT_NAME, new Effects.ResizeEffect({op: op}));
        }
    }
}

var add_actor_min_max_effect = function (actor, op) { 
    if (actor) {
        actor.add_effect_with_name(MIN_MAX_EFFECT_NAME, new Effects.MinimizeMaximizeEffect({op: op}));
    }
}

var stop_actor_wobbly_effect = function (actor) {
    if (actor) {
        let effect = actor.get_effect(EFFECT_NAME);
        if (effect) {
            effect.stop();
        }
    }
}

var destroy_actor_wobbly_effect = function (actor) {
    if (actor) {
        let effect = actor.get_effect(EFFECT_NAME);
        if (effect) {
            effect.destroy();
        }
    }
}

var destroy_actor_min_max_effect = function (actor) {
    if (actor) {
        let effect = actor.get_effect(MIN_MAX_EFFECT_NAME);
        if (effect) {
            effect.destroy();
        }
    }
}