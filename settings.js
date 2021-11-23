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
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const SCHEMA_PATH = 'org.gnome.shell.extensions.com.github.hermes83.compiz-alike-windows-effect';

function get_local_gsettings(schema_path) {
    const GioSSS = Gio.SettingsSchemaSource;

    let schemaDir = Extension.dir.get_child('schemas');

    let schemaSource = GioSSS.get_default();
    if (schemaDir.query_exists(null)) {
        schemaSource = GioSSS.new_from_directory(
            schemaDir.get_path(),
            schemaSource,
            false
        );
    }

    let schemaObj = schemaSource.lookup(schema_path, true);
    if (!schemaObj) {
        throw new Error('Schema ' + schema_path + ' could not be found for extension ' + Extension.metadata.uuid);
    }
    
    return new Gio.Settings({ settings_schema: schemaObj });
};

function Prefs() {
    var settings = this.settings = get_local_gsettings(SCHEMA_PATH);

    this.FRICTION = {
        key: 'friction',
        get: function () { return settings.get_double(this.key); },
        set: function (v) { settings.set_double(this.key, v); },
        changed: function (cb) { return settings.connect('changed::' + this.key, cb); },
        disconnect: function () { return settings.disconnect.apply(settings, arguments); },
    };

    this.SPRING = {
        key: 'spring',
        get: function () { return settings.get_double(this.key); },
        set: function (v) { settings.set_double(this.key, v); },
        changed: function (cb) { return settings.connect('changed::' + this.key, cb); },
        disconnect: function () { return settings.disconnect.apply(settings, arguments); },
    };

    this.MANUAL_RESTORE_FACTOR = {
        key: 'manual-restore-factor',
        get: function () { return settings.get_double(this.key); },
        set: function (v) { settings.set_double(this.key, v); },
        changed: function (cb) { return settings.connect('changed::' + this.key, cb); },
        disconnect: function () { return settings.disconnect.apply(settings, arguments); },
    };

    this.SKIP_FRAMES_BEFORE_SPRING_START = {
        key: 'skip-frames-before-spring-start',
        get: function () { return settings.get_double(this.key); },
        set: function (v) { settings.set_double(this.key, v); },
        changed: function (cb) { return settings.connect('changed::' + this.key, cb); },
        disconnect: function () { return settings.disconnect.apply(settings, arguments); },
    };

    this.MAXIMIZE_EFFECT_ENABLED = {
        key: 'maximize-effect-enabled',
        get: function () { return settings.get_boolean(this.key); },
        set: function (v) { settings.set_boolean(this.key, v); },
        changed: function (cb) { return settings.connect('changed::' + this.key, cb); },
        disconnect: function () { return settings.disconnect.apply(settings, arguments); },
    };

    this.RESIZE_EFFECT_ENABLED = {
        key: 'resize-effect-enabled',
        get: function () { return settings.get_boolean(this.key); },
        set: function (v) { settings.set_boolean(this.key, v); },
        changed: function (cb) { return settings.connect('changed::' + this.key, cb); },
        disconnect: function () { return settings.disconnect.apply(settings, arguments); },
    };

    this.MOVE_EFFECT_ENABLED = {
        key: 'move-effect-enabled',
        get: function () { return settings.get_boolean(this.key); },
        set: function (v) { settings.set_boolean(this.key, v); },
        changed: function (cb) { return settings.connect('changed::' + this.key, cb); },
        disconnect: function () { return settings.disconnect.apply(settings, arguments); },
    };

    this.X_TILES = {
        key: 'x-tiles',
        get: function () { return settings.get_double(this.key); },
        set: function (v) { settings.set_double(this.key, v); },
        changed: function (cb) { return settings.connect('changed::' + this.key, cb); },
        disconnect: function () { return settings.disconnect.apply(settings, arguments); },
    };

    this.Y_TILES = {
        key: 'y-tiles',
        get: function () { return settings.get_double(this.key); },
        set: function (v) { settings.set_double(this.key, v); },
        changed: function (cb) { return settings.connect('changed::' + this.key, cb); },
        disconnect: function () { return settings.disconnect.apply(settings, arguments); },
    };
};
