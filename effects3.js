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

const { GObject, Clutter, Meta } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Settings = Extension.imports.settings;
const Utils = Extension.imports.commonUtils;

const CLUTTER_TIMELINE_DURATION = 1000 * 1000;
const CORNER_RESIZING_DIVIDER = 6;

var AbstractCommonCompizAlikeWinEffect = GObject.registerClass({},
    class AbstractCommonCompizAlikeWinEffect extends Clutter.DeformEffect {

        _init(params = {}) {
            super._init();

            this.allocationChangedEvent = null;
            this.paintEvent = null;
            this.newFrameEvent = null;
            this.resizeEvent = null;
            this.parentActor = null;
            this.operationType = params.op;
            this.effectDisabled = false;
            this.timerId = null;
            this.initOldValues = true;
            this.i = 0;
            this.j = 0;
            this.k = 0;
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
            this.yCoefficient = 1;

            //Init stettings 
            let prefs = (new Settings.Prefs());

            this.MAXIMIZE_EFFECT_ENABLED = prefs.MAXIMIZE_EFFECT_ENABLED.get();
            this.RESIZE_EFFECT_ENABLED = prefs.RESIZE_EFFECT_ENABLED.get();
            this.X_MULTIPLIER = (100 - prefs.FRICTION.get()) * 2 / 100;
            this.Y_MULTIPLIER = (100 - prefs.FRICTION.get()) * 2 / 100;
            this.Y_STRETCH_MULTIPLIER = (100 - prefs.FRICTION.get()) * 2 / 100;
            this.END_EFFECT_DIVIDER = 4;
            this.END_RESTORE_X_FACTOR = 0.3 * (100 - prefs.SPRING.get()) / 100 + 1;
            this.END_RESTORE_Y_FACTOR = 0.3 * (100 - prefs.SPRING.get()) / 100 + 1;            
            this.END_FREEZE_X_FACTOR = prefs.SPRING.get() / 100;
            this.END_FREEZE_Y_FACTOR = prefs.SPRING.get() / 100;            
            this.DELTA_FREEZED = 80 * prefs.SPRING.get() / 100;
            this.STOP_COUNTER = 20;
            this.STOP_COUNTER_EXTRA = prefs.SKIP_FRAMES_BEFORE_SPRING_START.get();
            this.RESTORE_FACTOR = 1 + prefs.MANUAL_RESTORE_FACTOR.get() / 10;
            this.X_TILES = prefs.X_TILES.get();
            this.Y_TILES = prefs.Y_TILES.get();
        }

        vfunc_set_actor(actor) {
            super.vfunc_set_actor(actor);

            if (actor && !this.effectDisabled) {
                this.parentActor = actor.get_parent();
                this.set_n_tiles(this.X_TILES, this.Y_TILES);
                
                [this.width, this.height] = actor.get_size();
                
                this.allocationChangedEvent = this.actor.connect(Utils.is_3_38_shell_version() ? 'notify::allocation' : 'allocation-changed', this.on_actor_event.bind(this));
                this.paintEvent = actor.connect('paint', () => {});
                this.resizeEvent = actor.connect('notify::size', this.resized.bind(this));
                
                this.start_timer(this.on_tick_elapsed.bind(this), actor);
            }
        }

        start_timer(timerFunction, actor) {
            this.stop_timer();
            this.timerId = Utils.is_3_38_shell_version() ? new Clutter.Timeline({ actor: actor }) : new Clutter.Timeline();
            this.timerId.set_duration(CLUTTER_TIMELINE_DURATION);
            this.newFrameEvent = this.timerId.connect('new-frame', timerFunction);
            this.timerId.start();      
        }

        stop_timer() {
            if (this.timerId) {
                if (this.newFrameEvent) {
                    this.timerId.disconnect(this.newFrameEvent);
                    this.newFrameEvent = null;
                }
                this.timerId.run_dispose();
                this.timerId = null;
            }
        }

        resized(actor, params) {}

        destroy() {
            this.stop_timer();

            this.parentActor = null;
            
            let actor = this.get_actor();
            if (actor) {
                if (this.paintEvent) {
                    actor.disconnect(this.paintEvent);
                    this.paintEvent = null;
                }
            
                if (this.allocationChangedEvent) {
                    actor.disconnect(this.allocationChangedEvent);
                    this.allocationChangedEvent = null;
                }

                if (this.resizeEvent) {
                    actor.disconnect(this.resizeEvent);
                    this.resizeEvent = null;
                }

                actor.remove_effect(this);
            }
        }

        stop(actor) {
            [this.xDeltaStop, this.yDeltaStop] = [this.xDelta * 1.5, this.yDelta * 1.5];
            [this.xDeltaStopMoving, this.yDeltaStopMoving] = [0, 0];
            this.i = 0;
            
            this.start_timer(this.on_stop_tick_elapsed.bind(this), actor);
        }

        on_stop_tick_elapsed(timer, msecs) {
            this.i++;
    
            this.xDelta = this.xDeltaStop * Math.sin(this.i) / Math.exp(this.i / this.END_EFFECT_DIVIDER, 2);
            this.yDelta = this.yDeltaStop * Math.sin(this.i) / Math.exp(this.i / this.END_EFFECT_DIVIDER, 2);
            this.yDeltaStretch = this.yDelta;

            this.invalidate();

            return true;
        }
    }
);

var WobblyAlikeEffect = GObject.registerClass({},
    class WobblyAlikeEffect extends AbstractCommonCompizAlikeWinEffect {

        _init(params = {}) {
            super._init(params);
        }
        
        on_actor_event(actor, allocation, flags) {
            [this.xNew, this.yNew] = [actor.get_x(), actor.get_y()];
            [this.width, this.height] = actor.get_size();
            
            if (this.initOldValues) {
                let [xMouse, yMouse] = global.get_pointer();

                [this.xOld, this.yOld] = [this.xNew, this.yNew];
                [this.xPickedUp, this.yPickedUp] = [xMouse - this.xNew, yMouse - this.yNew];
                this.yCoefficient = (1 - this.yPickedUp / this.height) / (Math.pow(this.width, 2) * this.height);
                this.initOldValues = false;
            }

            this.xDelta += (this.xOld - this.xNew) * this.X_MULTIPLIER;
            this.yDelta += (this.yOld - this.yNew) * this.Y_MULTIPLIER;
            this.yDeltaStretch += (this.yOld - this.yNew) * this.Y_STRETCH_MULTIPLIER;

            [this.xOld, this.yOld] = [this.xNew, this.yNew];  
            
            this.j = (this.STOP_COUNTER + this.STOP_COUNTER_EXTRA);
            this.xDeltaFreezed = this.xDelta * this.END_FREEZE_X_FACTOR;
            this.yDeltaFreezed = this.yDelta * this.END_FREEZE_Y_FACTOR;
            [this.xDeltaStopMoving, this.yDeltaStopMoving] = [0, 0];

            return false;
        }

        resized(actor, params) {
            let newWidth, newHeight;
            [newWidth, newHeight] = actor.get_size();
            if (this.width <= newWidth && this.height <= newHeight && (this.width != newWidth || this.height != newHeight)) {
                this.destroy();
            } else {
                [this.xNew, this.yNew] = [newWidth, newHeight];
            }
        }

        on_tick_elapsed(timer, msec) {            
            this.xDelta /= this.RESTORE_FACTOR;
            this.yDelta /= this.RESTORE_FACTOR;
            this.yDeltaStretch /= this.RESTORE_FACTOR;

            this.j--;
            if (this.j < 0) {
                this.j = 0;
            } else if (this.j < this.STOP_COUNTER) {
                this.xDeltaFreezed /= this.END_RESTORE_X_FACTOR;
                this.yDeltaFreezed /= this.END_RESTORE_Y_FACTOR;
                this.xDeltaStopMoving = this.xDeltaFreezed * Math.sin(Math.PI * 2 * this.j / this.STOP_COUNTER);
                this.yDeltaStopMoving = this.yDeltaFreezed * Math.sin(Math.PI * 2 * this.j / this.STOP_COUNTER);
            }

            this.invalidate();

            return true;
        }
        
        vfunc_deform_vertex(w, h, v) {
            v.x += (1 - Math.cos(Math.PI * v.ty / 2)) * this.xDelta / 2
                + Math.abs(this.xPickedUp - this.width * v.tx) / this.width * this.xDeltaStopMoving;

            if (this.xPickedUp < this.width / 5) {
                v.y += this.yDelta - Math.pow(this.width - this.width * v.tx, 2) * this.yDelta * (this.height - this.height * v.ty) * this.yCoefficient
                    + Math.abs(this.yPickedUp - this.height * v.ty) / this.height * this.yDeltaStopMoving;
            } else if (this.xPickedUp > this.width * 0.8) {
                v.y += this.yDelta - Math.pow(this.width * v.tx, 2) * this.yDelta * (this.height - this.height * v.ty) * this.yCoefficient
                    + Math.abs(this.yPickedUp - this.height * v.ty) / this.height * this.yDeltaStopMoving;
            } else {
                v.y += Math.pow(this.width * v.tx - this.xPickedUp, 2) * this.yDelta * (this.height - this.height * v.ty) * this.yCoefficient
                    + this.yDeltaStretch * v.ty
                    + Math.abs(this.yPickedUp - this.height * v.ty) / this.height * this.yDeltaStopMoving;
            }            
        }
    }
);
        
var ResizeEffect = GObject.registerClass({},
    class ResizeEffect extends AbstractCommonCompizAlikeWinEffect {

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

        on_tick_elapsed(timer, msecs) {
            return true;
        }
        
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
    class MinimizeMaximizeEffect extends AbstractCommonCompizAlikeWinEffect {

        _init(params = {}) {
            super._init(params);

            this.j = (this.STOP_COUNTER + this.STOP_COUNTER_EXTRA);
            this.xDeltaFreezed = this.DELTA_FREEZED;
            this.yDeltaFreezed = this.DELTA_FREEZED;

            this.effectDisabled = !this.MAXIMIZE_EFFECT_ENABLED;
        }

        on_actor_event(actor, allocation, flags) {}

        on_tick_elapsed(timer, msecs) {
            this.j--;
            if (this.j < 0) {
                this.j = 0;
            } else {
                this.xDeltaFreezed /= 1.2;
                this.yDeltaFreezed /= 1.2;    
    
                this.xDeltaStopMoving = this.xDeltaFreezed * Math.sin(Math.PI * 8 * this.j / (this.STOP_COUNTER));
                this.yDeltaStopMoving = this.yDeltaFreezed * Math.sin(Math.PI * 8 * this.j / (this.STOP_COUNTER));

                this.invalidate();
            }

            return true;
        }
        
        vfunc_deform_vertex(w, h, v) {
            v.x += this.xDeltaStopMoving;
            v.y += this.yDeltaStopMoving;
        }

    }
);