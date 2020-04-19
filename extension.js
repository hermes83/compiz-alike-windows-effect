'use strict';

const { GLib, Meta } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const WindowUtils = Me.imports.windowUtils;

const TIMEOUT_DELAY = 1500;

let grabOpBeginId;
let grabOpEndId;
let timeoutId;

function enable() {
    grabOpBeginId = global.display.connect('grab-op-begin', (display, screen, window, op) => {
        if (Meta.GrabOp.MOVING != op &&
            Meta.GrabOp.RESIZING_NW != op &&
            Meta.GrabOp.RESIZING_NE != op &&
            Meta.GrabOp.RESIZING_SE != op &&
            Meta.GrabOp.RESIZING_SW != op &&
            Meta.GrabOp.RESIZING_W != op &&
            Meta.GrabOp.RESIZING_E != op &&
            Meta.GrabOp.RESIZING_S != op &&
            Meta.GrabOp.RESIZING_N != op) {
            return;
        }

        let actor = get_actor(window);
        if (actor) {
            stop_timer();            
            destroy_effect(window);
            add_effect(window, op);
        }
    });

    grabOpEndId = global.display.connect('grab-op-end', (display, screen, window, op) => {  
        let actor = get_actor(window);
        if (actor) {
            stop_effect(window);              
            
            timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TIMEOUT_DELAY, () => {
                stop_timer();
                destroy_effect(window);

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
        destroy_actor_effect(actor);
    });
}

function stop_timer() {
    if (timeoutId) {
        GLib.source_remove(timeoutId);
        timeoutId = 0;
    }
}

function get_actor(window) {
    if (window) {
        return window.get_compositor_private();
    }
    return null;
}

function get_actor_effect(window) {
    if (window) {
        let actor = window.get_compositor_private();
        if (actor) {
            return actor.get_effect('wobbly-effect');
        }
    }
    return null;
}

function add_effect(window, op) {
    let actor = get_actor(window);
    if (actor) {
        actor.add_effect_with_name('wobbly-effect', new WindowUtils.WobblyEffect({"op": op}));
    }
}

function stop_effect(window) {
    let effect = get_actor_effect(window);
    if (effect) {
        effect.on_stop();
    }
}

function destroy_effect(window) {
    let effect = get_actor_effect(window);
    if (effect) {
        effect.destroy();
    }
}

function destroy_actor_effect(actor) {
    if (actor) {
        let effect = actor.get_effect('wobbly-effect');
        if (effect) {
            effect.destroy();
        }
    }
}