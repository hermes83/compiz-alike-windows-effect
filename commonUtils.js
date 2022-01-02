/*
 * Compiz-alike-windows-effect for GNOME Shell
 *
 * Copyright (C) 2020
 *     Mauro Pepe <https://github.com/hermes83/compiz-alike-windows-effect>
 *
 * This file is part of the gnome-shell extension Compiz-alike-windows-effect.
 *
 * gnome-shell extension Compiz-alike-windows-effect is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * gnome-shell extension Compiz-alike-windows-effect is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell extension Compiz-alike-windows-effect.  If not, see
 * <http://www.gnu.org/licenses/>.
 */
'use strict';

const Meta = imports.gi.Meta;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Config = imports.misc.config;
const Settings = Extension.imports.settings;

const EFFECT_NAME = 'wobbly-effect';
const MIN_MAX_EFFECT_NAME = 'min-max-wobbly-effect';

const IS_3_XX_SHELL_VERSION = Config.PACKAGE_VERSION.startsWith("3");
const IS_3_38_SHELL_VERSION = Config.PACKAGE_VERSION.startsWith("3.38");
const HAS_GLOBAL_DISPLAY = !Config.PACKAGE_VERSION.startsWith("3.28");

const Effects = IS_3_XX_SHELL_VERSION ? Extension.imports.effects3 : Extension.imports.effects;

var currentWobblyAlikeEffect = null;
var currentMinMaxEffect = null;

var is_3_xx_shell_version = function () {
    return IS_3_XX_SHELL_VERSION;
}

var is_3_38_shell_version = function () {
    return IS_3_38_SHELL_VERSION;
}

var has_global_display = function () {
    return HAS_GLOBAL_DISPLAY;
}

var is_managed_op = function (op) {
    let prefs = (new Settings.Prefs());

    if (prefs.MOVE_EFFECT_ENABLED.get() && Meta.GrabOp.MOVING == op) {
        return true;
    }

    if (prefs.RESIZE_EFFECT_ENABLED.get() && (Meta.GrabOp.RESIZING_W == op || Meta.GrabOp.RESIZING_E == op || Meta.GrabOp.RESIZING_S == op || Meta.GrabOp.RESIZING_N == op || Meta.GrabOp.RESIZING_NW == op || Meta.GrabOp.RESIZING_NE == op || Meta.GrabOp.RESIZING_SE == op || Meta.GrabOp.RESIZING_SW == op)) {
        return true;
    }

    return false;
}

var get_actor = function(window) {
    if (window) {
        return window.get_compositor_private();
    }
    return null;
}

var has_wobbly_effect = function (actor) {
    return actor && actor.get_effect(EFFECT_NAME);
}

var add_actor_wobbly_effect = function (actor, op) { 
    if (actor) {
        if (Meta.GrabOp.MOVING == op) {
            actor.add_effect_with_name(EFFECT_NAME, new Effects.WobblyAlikeEffect({op: op}));
            currentWobblyAlikeEffect = actor.get_effect(EFFECT_NAME);
        } else {
            actor.add_effect_with_name(EFFECT_NAME, new Effects.ResizeEffect({op: op}));
            currentWobblyAlikeEffect = actor.get_effect(EFFECT_NAME);
        }
    }
}

var add_actor_min_max_effect = function (actor, op) { 
    if (actor) {
        actor.add_effect_with_name(MIN_MAX_EFFECT_NAME, new Effects.MinimizeMaximizeEffect({op: op}));
        currentMinMaxEffect = actor.get_effect(MIN_MAX_EFFECT_NAME);
    }
}

var stop_actor_wobbly_effect = function (actor) {
    if (actor) {
        let effect = actor.get_effect(EFFECT_NAME);
        if (effect) {
            effect.stop(actor);
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

    if (currentWobblyAlikeEffect) {
        currentWobblyAlikeEffect.destroy();
    }
    currentWobblyAlikeEffect = null;
}

var destroy_actor_min_max_effect = function (actor) {
    if (actor) {
        let effect = actor.get_effect(MIN_MAX_EFFECT_NAME);
        if (effect) {
            effect.destroy();
        }
    }

    if (currentMinMaxEffect) {
        currentMinMaxEffect.destroy();
    }
    currentMinMaxEffect = null;
}