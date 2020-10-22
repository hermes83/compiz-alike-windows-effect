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

function init() {}

function enable() {
    grabOpBeginId = global.display.connect('grab-op-begin', (display, screen, window, op) => {
        if (!Utils.is_managed_op(op)) {
            return;
        }

        let actor = Utils.get_actor(window);
        if (actor) {
            stop_wobbly_timer();            
            stop_min_max_timer();
            
            Utils.destroy_actor_wobbly_effect(actor);
            Utils.destroy_actor_min_max_effect(actor);
            Utils.add_actor_wobbly_effect(actor, op);
        }
    });

    grabOpEndId = global.display.connect('grab-op-end', (display, screen, window, op) => {  
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
    });

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
}

function disable() {    
    global.display.disconnect(grabOpBeginId);
    global.display.disconnect(grabOpEndId);
    global.window_manager.disconnect(resizeMinMaxOpId);
    
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
