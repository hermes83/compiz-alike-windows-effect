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

const { GLib, Meta } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.commonUtils;

const TIMEOUT_DELAY = 1500;

let grabOpBeginId;
let grabOpEndId;
let resizeMinMaxOpId;
let minimizeId;
let unminimizeId;
let timeoutWobblyId;
let timeoutMinMaxId;
let originalSpeed;
let destroyId;

function init() {}

function enable() {
    if (Utils.is_3_xx_shell_version()) {
        grabOpBeginId = global.display.connect('grab-op-begin', (display, screen, window, op) => {
            grabStart(window, op);
        });
    } else {
        grabOpBeginId = global.display.connect('grab-op-begin', (display, window, op) => {
            grabStart(window, op);
        });
    }

    if (Utils.is_3_xx_shell_version()) {
        grabOpEndId = global.display.connect('grab-op-end', (display, screen, window, op) => {  
            grabEnd(window, op);
        });
    } else {
        grabOpEndId = global.display.connect('grab-op-end', (display, window, op) => {  
            grabEnd(window, op);
        });
    }

    resizeMinMaxOpId = global.window_manager.connect('size-change', (e, actor, op) => {
        if (op == 1 && Utils.has_wobbly_effect(actor)) {
            return;
        } 

        stop_wobbly_timer();
        Utils.destroy_actor_wobbly_effect(actor);
    
        stop_min_max_timer();            
        Utils.destroy_actor_min_max_effect(actor);

        Utils.add_actor_min_max_effect(actor, op);
        timeoutMinMaxId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TIMEOUT_DELAY, () => {
            stop_min_max_timer();

            if (actor) {
                Utils.destroy_actor_min_max_effect(actor);
            }

            return false;
        });
    });
    
    minimizeId = global.window_manager.connect("minimize", (e, actor) => {
        if (Utils.has_wobbly_effect(actor)) {
            stop_wobbly_timer();
            Utils.destroy_actor_wobbly_effect(actor);
        }
    });
    
    unminimizeId = global.window_manager.connect("unminimize", (e, actor) => {
        if (Utils.has_wobbly_effect(actor)) {
            stop_wobbly_timer();
            Utils.destroy_actor_wobbly_effect(actor);
        }
    });

    destroyId = global.window_manager.connect("destroy", (e, actor) => {
        if (Utils.has_wobbly_effect(actor)) {
            stop_wobbly_timer();
            Utils.destroy_actor_wobbly_effect(actor);
            Utils.destroy_actor_min_max_effect(actor);
        }
    });
}

function disable() {    
    global.display.disconnect(grabOpBeginId);
    global.display.disconnect(grabOpEndId);
    global.window_manager.disconnect(resizeMinMaxOpId);
    global.window_manager.disconnect(destroyId);
    
    stop_wobbly_timer();
    
    global.get_window_actors().forEach((actor) => {
        Utils.destroy_actor_wobbly_effect(actor);
        Utils.destroy_actor_min_max_effect(actor);
    });
}

function stop_wobbly_timer() {
    if (timeoutWobblyId) {
        GLib.source_remove(timeoutWobblyId);
        timeoutWobblyId = 0;
    }
}

function stop_min_max_timer() {
    if (timeoutMinMaxId) {
        GLib.source_remove(timeoutMinMaxId);
        timeoutMinMaxId = 0;
    }
}

function grabStart(window, op) {
    let actor = Utils.get_actor(window);
    if (actor) {
        stop_wobbly_timer();            
        stop_min_max_timer();
        
        Utils.destroy_actor_wobbly_effect(actor);
        Utils.destroy_actor_min_max_effect(actor);

        if (Utils.is_managed_op(op)) {
            Utils.add_actor_wobbly_effect(actor, op);
        }
    }
}

function grabEnd(window, op) {
    let actor = Utils.get_actor(window);
    if (actor) {
        Utils.stop_actor_wobbly_effect(actor);

        timeoutWobblyId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TIMEOUT_DELAY, () => {
            stop_wobbly_timer();

            let actor = Utils.get_actor(window);
            if (actor) {
                Utils.destroy_actor_wobbly_effect(actor);
            }

            return false;
        });
    }
}