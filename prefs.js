const Gtk = imports.gi.Gtk;

let Extension = imports.misc.extensionUtils.getCurrentExtension();
let Settings = Extension.imports.settings;

let frictionSlider = null;
let springSlider = null;
// let autoRestoreFactor = null;
let manualRestoreFactor = null;
let skipFramesBeforeSpringStart = null;
let maximizeEffectSwitch = null;
let resizeEffectSwitch = null;

function init() { }

function buildPrefsWidget() {
	let config = new Settings.Prefs();

	let frame = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		border_width: 20, 
		spacing: 20
	});

	frictionSlider = addSlider(frame, "Friction", config.FRICTION, 1, 99, 0);
	springSlider = addSlider(frame, "Spring", config.SPRING, 1, 99, 0);
	// autoRestoreFactor = addBooleanSwitch(frame, "Autotune restore factor", config.AUTO_RESTORE_FACTOR);
	manualRestoreFactor = addSlider(frame, "Restore factor", config.MANUAL_RESTORE_FACTOR, 1, 10, 0);
	skipFramesBeforeSpringStart = addSlider(frame, "Skip frames before spring starts", config.SKIP_FRAMES_BEFORE_SPRING_START, 1, 20, 0);
	maximizeEffectSwitch = addBooleanSwitch(frame, "Maximize effect enabled", config.MAXIMIZE_EFFECT_ENABLED);
	resizeEffectSwitch = addBooleanSwitch(frame, "Resize effect enabled", config.RESIZE_EFFECT_ENABLED);

	addDefaultButton(frame, config);

	frame.show_all();
	
	return frame;
}

function addDefaultButton(frame, config) {
	let button = new Gtk.Button({label: "Reset to default"});
	button.connect('clicked', function () {
		config.FRICTION.set(20);
		config.SPRING.set(40);
		// config.AUTO_RESTORE_FACTOR.set(false);
		config.MANUAL_RESTORE_FACTOR.set(4);
		config.SKIP_FRAMES_BEFORE_SPRING_START.set(1);
		config.MAXIMIZE_EFFECT_ENABLED.set(true);
		config.RESIZE_EFFECT_ENABLED.set(true);

		frictionSlider.set_value(config.FRICTION.get());
		springSlider.set_value(config.SPRING.get());
		// autoRestoreFactor.set_active(config.AUTO_RESTORE_FACTOR.get());
		manualRestoreFactor.set_value(config.MANUAL_RESTORE_FACTOR.get());
		skipFramesBeforeSpringStart.set_value(config.SKIP_FRAMES_BEFORE_SPRING_START.get());
		maximizeEffectSwitch.set_active(config.MAXIMIZE_EFFECT_ENABLED.get());
		resizeEffectSwitch.set_active(config.RESIZE_EFFECT_ENABLED.get());
	});

	frame.pack_end(button, false, false, 0);
	
	return button;
}

function addSlider(frame, labelText, prefConfig, lower, upper, decimalDigits) {
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
	
	frame.add(hbox);
	
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
	hbox.add(new Gtk.Label({label: labelText, use_markup: true}));
	hbox.add(gtkSwitch);
	
	frame.add(hbox);
	
	return gtkSwitch;
}