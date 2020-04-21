'use strict';

const { GLib, Meta } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.commonUtils;

const TIMEOUT_DELAY = 1500;

let grabOpBeginId;
let grabOpEndId;
let timeoutId;

function enable() {
    grabOpBeginId = global.display.connect('grab-op-begin', (display, screen, window, op) => {
        if (!Utils.is_managed_op(op)) {
            return;
        }

        let actor = Utils.get_actor(window);
        if (actor) {
            stop_timer();            
            Utils.destroy_effect(window);
            Utils.add_effect(window, op);
        }
    });

    grabOpEndId = global.display.connect('grab-op-end', (display, screen, window, op) => {  
        let actor = Utils.get_actor(window);
        if (actor) {
            Utils.stop_effect(window);              
            
            timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TIMEOUT_DELAY, () => {
                stop_timer();
                Utils.destroy_effect(window);

                return false;
            });
        }
    });
}

function disable() {
    global.display.disconnect(grabOpBeginId);
    global.display.disconnect(grabOpEndId);
    
    stop_timer();
    
    global.get_window_actors().forEach((actor) => {
        Utils.destroy_actor_effect(actor);
    });
}

function stop_timer() {
    if (timeoutId) {
        GLib.source_remove(timeoutId);
        timeoutId = 0;
    }
}