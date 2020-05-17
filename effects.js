'use strict';

const { GObject, Clutter, Meta } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Settings = Extension.imports.settings;

const CLUTTER_TIMELINE_DURATION = 1000 * 1000;
const CORNER_RESIZING_DIVIDER = 6;
const STOP_COUNTER = 15;
const STOP_COUNTER_EXTRA = 1;

var AbstractCommonEffect = GObject.registerClass({},
    class AbstractCommonEffect extends Clutter.DeformEffect {

        _init(params = {}) {
            super._init();

            this.allocationChangedEvent = null;
            this.paintEvent = null;
            this.newFrameEvent = null;
            this.parentActor = null;
            this.operationType = params.op;
            this.effectDisabled = false;
            this.timerId = null;
            this.initOldValues = true;
            this.i = 0;
            this.j = 0;
            this.xPickedUp = 0;
            this.yPickedUp = 0;
            this.width = 0;
            this.height = 0;
            this.xNew = 0;
            this.yNew = 0;
            this.xOld = 0;
            this.yOld = 0;
            this.xDelta = 0;
            this.yDelta = 0;
            this.yDeltaStretch = 0;
            this.xDeltaStop = 0;
            this.yDeltaStop = 0;
            this.xDeltaStopMoving = 0;
            this.yDeltaStopMoving = 0;
            this.xDeltaFreezed = 0;
            this.yDeltaFreezed = 0;
            this.divider = 1;

            //Init stettings 
            let prefs = (new Settings.Prefs());
            let factor = (100 - prefs.FRICTION.get()) * 2 / 100;
            let spring = 0.3 * (100 - prefs.SPRING.get()) / 100 + 1;
            let restoreFactor = 1.4;

            this.MAXIMIZE_EFFECT_ENABLED = prefs.MAXIMIZE_EFFECT_ENABLED.get();
            this.RESIZE_EFFECT_ENABLED = prefs.RESIZE_EFFECT_ENABLED.get();
            this.RESTORE_X_FACTOR = restoreFactor;
            this.RESTORE_Y_FACTOR = restoreFactor;
            this.RESTORE_Y_STRETCH_FACTOR = restoreFactor;
            this.X_MULTIPLIER = factor;
            this.Y_MULTIPLIER = factor;
            this.Y_STRETCH_MULTIPLIER = factor;
            this.END_EFFECT_DIVIDER = 4;
            this.END_RESTORE_X_FACTOR = spring;
            this.END_RESTORE_Y_FACTOR = spring;            
            this.DELTA_FREEZED = 80 * prefs.SPRING.get() / 100;
        }

        vfunc_set_actor(actor) {
            super.vfunc_set_actor(actor);

            if (actor && !this.effectDisabled) {
                this.parentActor = actor.get_parent();
                // this.parentActor.set_offscreen_redirect(Clutter.OffscreenRedirect.AUTOMATIC_FOR_OPACITY);

                actor.has_overlaps = () => { return false; };
                // actor.set_offscreen_redirect(Clutter.OffscreenRedirect.ALWAYS);

                [this.width, this.height] = actor.get_size();
                
                this.allocationChangedEvent = actor.connect('allocation-changed', this.on_actor_event.bind(this));
                this.paintEvent = actor.connect('paint', () => {});
                
                this.timerId = new Clutter.Timeline({ duration: CLUTTER_TIMELINE_DURATION });
                this.newFrameEvent = this.timerId.connect('new-frame', this.on_tick_elapsed.bind(this));
                this.timerId.start();
            }
        }

        destroy() {
            if (this.timerId) {
                if (this.newFrameEvent) {
                    this.timerId.disconnect(this.newFrameEvent);
                    this.newFrameEvent = null;
                }
                this.timerId.run_dispose();
                this.timerId = null;
            }

            // if (this.parentActor) {
            //     this.parentActor.set_offscreen_redirect(Clutter.OffscreenRedirect.AUTOMATIC_FOR_OPACITY);
            // }
            this.parentActor = null;
            
            let actor = this.get_actor();
            if (actor) {
                // actor.set_offscreen_redirect(Clutter.OffscreenRedirect.AUTOMATIC_FOR_OPACITY);

                if (this.paintEvent) {
                    actor.disconnect(this.paintEvent);
                    this.paintEvent = null;
                }
            
                if (this.allocationChangedEvent) {
                    actor.disconnect(this.allocationChangedEvent);
                    this.allocationChangedEvent = null;
                }

                actor.remove_effect(this);
            }
        }

        stop() {
            [this.xDeltaStop, this.yDeltaStop] = [this.xDelta * 1.5, this.yDelta * 1.5];
            this.i = 0;
            
            if (this.j > 0 && this.j < STOP_COUNTER) {
                [this.xDelta, this.yDelta] = [this.xDeltaStopMoving * this.END_EFFECT_DIVIDER, this.yDeltaStopMoving * this.END_EFFECT_DIVIDER];
            }
            this.j = 0;
            [this.xDeltaStopMoving, this.yDeltaStopMoving] = [0, 0];

            if (this.timerId) {
                if (this.newFrameEvent) {
                    this.timerId.disconnect(this.newFrameEvent);
                    this.newFrameEvent = null;
                }
                this.timerId.run_dispose();
            }
            this.timerId = new Clutter.Timeline({ duration: CLUTTER_TIMELINE_DURATION });
            this.newFrameEvent = this.timerId.connect('new-frame', this.on_stop_tick_elapsed.bind(this));
            this.timerId.start();        
        }

        on_stop_tick_elapsed() {
            this.i++;
    
            this.xDelta = this.xDeltaStop * Math.sin(this.i) / Math.exp(this.i / 4, 2);
            this.yDelta = this.yDeltaStop * Math.sin(this.i) / Math.exp(this.i / 4, 2);
            this.yDeltaStretch = this.yDelta;

            this.invalidate();

            return true;
        }
    }
);

var WobblyEffect = GObject.registerClass({},
    class WobblyEffect extends AbstractCommonEffect {

        _init(params = {}) {
            super._init(params);
        }
        
        on_actor_event(actor, allocation, flags) {
            [this.xNew, this.yNew] = allocation.get_origin();
            [this.width, this.height] = actor.get_size();
            
            this.divider = Math.pow(this.width, 2) * this.height;

            if (this.initOldValues) {
                let [xMouse, yMouse] = global.get_pointer();

                [this.xOld, this.yOld] = [this.xNew, this.yNew];
                [this.xPickedUp, this.yPickedUp] = [xMouse - this.xNew, yMouse - this.yNew];

                this.initOldValues = false;
            }

            this.xDelta += (this.xOld - this.xNew) * this.X_MULTIPLIER;
            this.yDelta += (this.yOld - this.yNew) * this.Y_MULTIPLIER;
            this.yDeltaStretch += (this.yOld - this.yNew) * this.Y_STRETCH_MULTIPLIER;

            [this.xOld, this.yOld] = [this.xNew, this.yNew];  
            
            this.j = (STOP_COUNTER + STOP_COUNTER_EXTRA);
            [this.xDeltaStopMoving, this.yDeltaStopMoving] = [0, 0];
        }

        on_tick_elapsed() {
            this.xDelta /= this.RESTORE_X_FACTOR;
            this.yDelta /= this.RESTORE_Y_FACTOR;
            this.yDeltaStretch /= this.RESTORE_Y_STRETCH_FACTOR;

            this.j--;
            if (this.j < 0) {
                this.j = 0;
            } else if (this.j == STOP_COUNTER) {
                this.xDeltaFreezed = this.xDelta / this.END_EFFECT_DIVIDER;
                this.yDeltaFreezed = this.yDelta / this.END_EFFECT_DIVIDER;
            } else if (this.j < STOP_COUNTER) {
                this.xDeltaFreezed /= this.END_RESTORE_X_FACTOR;
                this.yDeltaFreezed /= this.END_RESTORE_Y_FACTOR;
                this.xDeltaStopMoving = this.xDeltaFreezed * Math.sin(Math.PI * 2 * this.j / STOP_COUNTER);
                this.yDeltaStopMoving = this.yDeltaFreezed * Math.sin(Math.PI * 2 * this.j / STOP_COUNTER);
            }

            this.invalidate();
            
            return true;
        }
        
        vfunc_deform_vertex(w, h, v) {
            v.x += (1 - Math.cos(Math.PI * v.y / h / 2)) * this.xDelta / 3 + this.xDeltaStopMoving;
            v.y += this.xPickedUp <= w / 5 ? this.yDelta - Math.pow(w - v.x, 2) * this.yDelta * (h - v.y) / this.divider + this.yDeltaStopMoving :
                   this.xPickedUp >= w - w / 5 ? this.yDelta - Math.pow(v.x, 2) * this.yDelta * (h - v.y) / this.divider + this.yDeltaStopMoving :
                   this.yDeltaStretch * v.y / h + Math.pow(v.x - this.xPickedUp, 2) * this.yDelta * (h - v.y) / this.divider + this.yDeltaStopMoving;
        }

    }
);
        
var ResizeEffect = GObject.registerClass({},
    class ResizeEffect extends AbstractCommonEffect {

        _init(params = {}) {
            super._init(params);

            this.effectDisabled = !this.RESIZE_EFFECT_ENABLED;
        }

        on_actor_event(actor, allocation, flags) {
            [this.xNew, this.yNew] = global.get_pointer();

            if (this.initOldValues) {
                let [xWin, yWin] = actor.get_position();

                [this.xOld, this.yOld] = [this.xNew, this.yNew];
                [this.xPickedUp, this.yPickedUp] = [this.xNew - xWin, this.yNew - yWin];
                
                this.initOldValues = false;     
            }

            this.xDelta += (this.xOld - this.xNew) * this.X_MULTIPLIER;
            this.yDelta += (this.yOld - this.yNew) * this.Y_MULTIPLIER;

            [this.xOld, this.yOld] = [this.xNew, this.yNew];            
        }

        on_tick_elapsed() {}
        
        vfunc_deform_vertex(w, h, v) {
            switch (this.operationType) {
                case Meta.GrabOp.RESIZING_W:
                    v.x += this.xDelta * (w - v.x) * Math.pow(v.y - this.yPickedUp, 2) / (Math.pow(h, 2) * w);
                    break;

                case Meta.GrabOp.RESIZING_E:
                    v.x += this.xDelta * v.x * Math.pow(v.y - this.yPickedUp, 2) / (Math.pow(h, 2) * w);
                    break;

                case Meta.GrabOp.RESIZING_S:
                    v.y += this.yDelta * v.y * Math.pow(v.x - this.xPickedUp, 2) / (Math.pow(w, 2) * h);
                    break;

                case Meta.GrabOp.RESIZING_N:
                    v.y += this.yDelta * (h - v.y) * Math.pow(v.x - this.xPickedUp, 2) / (Math.pow(w, 2) * h);
                    break;      

                case Meta.GrabOp.RESIZING_NW:
                    v.x += this.xDelta / CORNER_RESIZING_DIVIDER * (w - v.x) * Math.pow(v.y, 2) / (Math.pow(h, 2) * w);
                    v.y +=  this.yDelta / CORNER_RESIZING_DIVIDER * (h - v.y) * Math.pow(v.x, 2) / (Math.pow(w, 2) * h);  
                    break;
                    
                case Meta.GrabOp.RESIZING_NE:
                    v.x += this.xDelta / CORNER_RESIZING_DIVIDER * v.x * Math.pow(v.y, 2) / (Math.pow(h, 2) * w);
                    v.y += this.yDelta / CORNER_RESIZING_DIVIDER * (h - v.y) * Math.pow(w - v.x, 2) / (Math.pow(w, 2) * h);    
                    break;

                case Meta.GrabOp.RESIZING_SE:
                    v.x += this.xDelta / CORNER_RESIZING_DIVIDER * v.x * Math.pow(h - v.y, 2) / (Math.pow(h, 2) * w);
                    v.y += this.yDelta / CORNER_RESIZING_DIVIDER * v.y * Math.pow(w - v.x, 2) / (Math.pow(w, 2) * h);    
                    break;

                case Meta.GrabOp.RESIZING_SW:
                    v.x += this.xDelta / CORNER_RESIZING_DIVIDER * (w - v.x) * Math.pow(v.y - h, 2) / (Math.pow(h, 2) * w);
                    v.y += this.yDelta / CORNER_RESIZING_DIVIDER * v.y * Math.pow(v.x, 2) / (Math.pow(w, 2) * h);
                    break;          
            }

        }
    }
);

var MinimizeMaximizeEffect = GObject.registerClass({},
    class MinimizeMaximizeEffect extends AbstractCommonEffect {

        _init(params = {}) {
            super._init(params);

            this.j = (STOP_COUNTER + STOP_COUNTER_EXTRA);
            this.xDeltaFreezed = this.DELTA_FREEZED;
            this.yDeltaFreezed = this.DELTA_FREEZED;

            this.effectDisabled = !this.MAXIMIZE_EFFECT_ENABLED;
        }

        on_actor_event(actor, allocation, flags) {}

        on_tick_elapsed() {
            this.j--;
            if (this.j < 0) {
                this.j = 0;
            } else {
                this.xDeltaFreezed /= 1.2;
                this.yDeltaFreezed /= 1.2;    
    
                this.xDeltaStopMoving = this.xDeltaFreezed * Math.sin(Math.PI * 8 * this.j / (STOP_COUNTER));
                this.yDeltaStopMoving = this.yDeltaFreezed * Math.sin(Math.PI * 8 * this.j / (STOP_COUNTER));

                this.invalidate();
            }
        }
        
        vfunc_deform_vertex(w, h, v) {
            v.x += this.xDeltaStopMoving;
            v.y += this.yDeltaStopMoving;
        }

    }
);