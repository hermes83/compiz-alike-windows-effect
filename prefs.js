const Gtk = imports.gi.Gtk;

let Extension = imports.misc.extensionUtils.getCurrentExtension();
let Settings = Extension.imports.settings;

function init() { }

function buildPrefsWidget() {
	let config = new Settings.Prefs();
	
	let frame = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		border_width: 10, 
		spacing: 10
	});

	frame.add(addSlider("Friction", config.FRICTION, 1, 99, 0));
	frame.add(addSlider("Spring", config.SPRING, 1, 99, 0));
	frame.add(addBooleanSwitch("Maximize effect enabled", config.MAXIMIZE_EFFECT_ENABLED));
	frame.add(addBooleanSwitch("Resize effect enabled", config.RESIZE_EFFECT_ENABLED));

	frame.show_all();

	return frame;
}

function addSlider(labelText, prefConfig, lower, upper, decimalDigits) {
	let scale = new Gtk.HScale({
		digits: decimalDigits,
		adjustment: new Gtk.Adjustment({lower: lower, upper: upper}),
		value_pos: Gtk.PositionType.RIGHT,
		hexpand: true, 
		halign: Gtk.Align.END
	});
	scale.set_value(prefConfig.get());
	scale.connect('value-changed', function (sw) {
		var newval = sw.get_value();
		if (newval != prefConfig.get()) {
			prefConfig.set(newval);
		}
	});
	scale.set_size_request(400, 15);

	let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20});
	hbox.add(new Gtk.Label({label: labelText, use_markup: true}));
	hbox.add(scale);
	
	return hbox;
}

function addBooleanSwitch(labelText, prefConfig) {
	let gtkSwitch = new Gtk.Switch({hexpand: true, halign: Gtk.Align.END});
	gtkSwitch.set_active(prefConfig.get());
	gtkSwitch.connect('state-set', function (sw) {
		var newval = sw.get_active();
		if (newval != prefConfig.get()) {
			prefConfig.set(newval);
		}
	});

	let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20});
	hbox.add(new Gtk.Label({label: labelText, use_markup: true}));
	hbox.add(gtkSwitch);
	
	return hbox;
}