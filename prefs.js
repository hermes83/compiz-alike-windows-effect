const Gtk = imports.gi.Gtk;

let Extension = imports.misc.extensionUtils.getCurrentExtension();
let Settings = Extension.imports.settings;

function init() { }

function buildPrefsWidget() {
	let config = new Settings.Prefs();
	let frame = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		border_width: 10
	});

	// frame.add(addSlider("Restore X factor\n<small>(1.2 = heavy, 2 = light)</small>", config.RESTORE_X_FACTOR, 1.2, 2, 0.1));
	// frame.add(addSlider("Restore Y factor\n<small>(1.2 = heavy, 2 = light)</small>", config.RESTORE_Y_FACTOR, 1.2, 2, 0.1));

	frame.add(addBooleanSwitch("Maximize effect enabled", config.MAXIMIZE_EFFECT_ENABLED));

	frame.show_all();
	return frame;
}

function addSlider(labelText, prefConfig, lower, upper, increment) {
	let scale = new Gtk.HScale({
		digits: 2,
		adjustment: new Gtk.Adjustment({lower: lower, upper: upper, step_increment: increment}),
		value_pos: Gtk.PositionType.RIGHT
	});
	scale.set_value(prefConfig.get());
	scale.connect('value-changed', function (sw) {
		var newval = sw.get_value();
		if (newval != prefConfig.get()) {
			prefConfig.set(newval);
		}
	});

	let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20});
	hbox.add(new Gtk.Label({label: labelText, use_markup: true}));
	hbox.pack_end(scale, true, true, 0);
	
	return hbox;
}

function addBooleanSwitch(labelText, prefConfig) {
	let gtkSwitch = new Gtk.Switch();
	gtkSwitch.set_active(prefConfig.get());
	gtkSwitch.connect('state-set', function (sw	) {
		var newval = sw.get_active();
		if (newval != prefConfig.get()) {
			prefConfig.set(newval);
		}
	});

	let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20});
	hbox.add(new Gtk.Label({label: labelText, use_markup: true}));
	hbox.pack_end(gtkSwitch, false, false, 0);
	
	return hbox;
}