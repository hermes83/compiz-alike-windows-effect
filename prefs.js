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
const Gtk = imports.gi.Gtk;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Extension.imports.settings;
const Config = imports.misc.config;

const IS_3_XX_SHELL_VERSION = Config.PACKAGE_VERSION.startsWith("3");

let frictionSlider = null;
let springSlider = null;
let manualRestoreFactor = null;
let skipFramesBeforeSpringStart = null;
let maximizeEffectSwitch = null;
let resizeEffectSwitch = null;
let moveEffectSwitch = null;
let xTilesSlider = null;
let yTilesSlider = null;

function init() { }

function buildPrefsWidget() {
    let config = new Settings.Prefs();

    let frame;
    if (IS_3_XX_SHELL_VERSION) {
        frame = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            border_width: 20, 
            spacing: 20
        });
    } else {
        frame = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_top: 20,
            margin_bottom: 20,
            margin_start: 20,
            margin_end: 20,
            spacing: 20
        });
    }

    frictionSlider = addSlider(frame, "Friction", config.FRICTION, 0, 99, 0);
    springSlider = addSlider(frame, "Spring", config.SPRING, 0, 99, 0);
    manualRestoreFactor = addSlider(frame, "Restore factor", config.MANUAL_RESTORE_FACTOR, 1, 10, 0);
    skipFramesBeforeSpringStart = addSlider(frame, "Skip frames before spring starts", config.SKIP_FRAMES_BEFORE_SPRING_START, 1, 20, 0);
    maximizeEffectSwitch = addBooleanSwitch(frame, "Maximize effect enabled", config.MAXIMIZE_EFFECT_ENABLED);
    resizeEffectSwitch = addBooleanSwitch(frame, "Resize effect enabled", config.RESIZE_EFFECT_ENABLED);
    moveEffectSwitch = addBooleanSwitch(frame, "Move effect enabled", config.MOVE_EFFECT_ENABLED);
    xTilesSlider = addSlider(frame, "X Tiles", config.X_TILES, 3.0, 20.0, 0);
    yTilesSlider = addSlider(frame, "Y Tiles", config.Y_TILES, 3.0, 20.0, 0);

    addDefaultButton(frame, config);

    if (IS_3_XX_SHELL_VERSION) {
        frame.show_all();
    }

    return frame;
}

function addDefaultButton(frame, config) {
    let button = null;
    if (IS_3_XX_SHELL_VERSION) {
        button = new Gtk.Button({label: "Reset to default"});
    } else {
        button = new Gtk.Button({label: "Reset to default", vexpand: true, valign: Gtk.Align.END});
    }

    button.connect('clicked', function () {
        config.FRICTION.set(20);
        config.SPRING.set(40);
        config.MANUAL_RESTORE_FACTOR.set(4);
        config.SKIP_FRAMES_BEFORE_SPRING_START.set(1);
        config.MAXIMIZE_EFFECT_ENABLED.set(true);
        config.RESIZE_EFFECT_ENABLED.set(true);
        config.MOVE_EFFECT_ENABLED.set(true);
        config.X_TILES.set(6.0);
        config.Y_TILES.set(4.0);

        frictionSlider.set_value(config.FRICTION.get());
        springSlider.set_value(config.SPRING.get());
        manualRestoreFactor.set_value(config.MANUAL_RESTORE_FACTOR.get());
        skipFramesBeforeSpringStart.set_value(config.SKIP_FRAMES_BEFORE_SPRING_START.get());
        maximizeEffectSwitch.set_active(config.MAXIMIZE_EFFECT_ENABLED.get());
        resizeEffectSwitch.set_active(config.RESIZE_EFFECT_ENABLED.get());
        moveEffectSwitch.set_active(config.MOVE_EFFECT_ENABLED.get());
        xTilesSlider.set_value(config.X_TILES.get());
        yTilesSlider.set_value(config.Y_TILES.get());
    });

    if (IS_3_XX_SHELL_VERSION) {
        frame.pack_end(button, false, false, 0);
    } else {
        frame.append(button);
    }
    
    return button;
}

function addSlider(frame, labelText, prefConfig, lower, upper, decimalDigits) {
    let scale = new Gtk.Scale({
        digits: decimalDigits,
        adjustment: new Gtk.Adjustment({lower: lower, upper: upper}),
        value_pos: Gtk.PositionType.RIGHT,
        hexpand: true, 
        halign: Gtk.Align.END
    });
    if (!IS_3_XX_SHELL_VERSION) {
        scale.set_draw_value(true);
    }
    scale.set_value(prefConfig.get());
    scale.connect('value-changed', function (sw) {
        var newval = sw.get_value();
        if (newval != prefConfig.get()) {
            prefConfig.set(newval);
        }
    });
    scale.set_size_request(400, 15);

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20});
    if (IS_3_XX_SHELL_VERSION) {
        hbox.add(new Gtk.Label({label: labelText, use_markup: true}));
        hbox.add(scale);
        
        frame.add(hbox);
    } else {
        hbox.append(new Gtk.Label({label: labelText, use_markup: true}));
        hbox.append(scale);
        
        frame.append(hbox);
    }
    
    return scale;
}

function addBooleanSwitch(frame, labelText, prefConfig) {
    let gtkSwitch = new Gtk.Switch({hexpand: true, halign: Gtk.Align.END});
    gtkSwitch.set_active(prefConfig.get());
    gtkSwitch.connect('state-set', function (sw) {
        var newval = sw.get_active();
        if (newval != prefConfig.get()) {
            prefConfig.set(newval);
        }
    });

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20});
    if (IS_3_XX_SHELL_VERSION) {
        hbox.add(new Gtk.Label({label: labelText, use_markup: true}));
        hbox.add(gtkSwitch);
        
        frame.add(hbox);
    } else {
        hbox.append(new Gtk.Label({label: labelText, use_markup: true}));
        hbox.append(gtkSwitch);
        
        frame.append(hbox);
    }
    
    return gtkSwitch;
}