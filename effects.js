'use strict';

const { GObject, Clutter, Meta, cairo } = imports.gi;

const CLUTTER_TIMELINE_DURATION = 1000 * 1000;

const RESTORE_X_FACTOR = 1.4;
const RESTORE_Y_FACTOR = 1.4;
const RESTORE_Y_STRETCH_FACTOR = 1.5;
const X_MULTIPLIER = 1.2;
const Y_MULTIPLIER = 1.2;
const Y_STRETCH_MULTIPLIER = 1.5

const X_CLEAN_EXTRA_DELTA = 5;
const Y_CLEAN_EXTRA_DELTA = 5;
const X_CLEAN_SIZE = 2;
const Y_CLEAN_SIZE = 2;
const X_CLEAN_MARGIN = 1;
const Y_CLEAN_MARGIN = 1;

var AbstractCommonEffect = GObject.registerClass({},
    class AbstractCommonEffect extends Clutter.DeformEffect {

        _init(params = {}) {
            super._init();

            this.parentActor = null;
            this.operationType = params.op;

            this.timerId = null;
            this.initOldValues = true;
            this.i = 0;
            
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
        }

        vfunc_set_actor(actor) {
            super.vfunc_set_actor(actor);

            if (actor) {
                this.parentActor = actor.get_parent();

                [this.width, this.height] = actor.get_size();

                actor.connect('allocation-changed', this.on_actor_event.bind(this));
                
                this.timerId = new Clutter.Timeline({ duration: CLUTTER_TIMELINE_DURATION });
                this.timerId.connect('new-frame', this.on_tick_elapsed.bind(this));
                this.timerId.start();
            }
        }

        destroy() {
            if (this.timerId) {
                this.timerId.run_dispose();
                this.timerId = null;
            }

            this.parentActor = null;
            
            let actor = this.get_actor();
            if (actor) {
                actor.remove_effect(this);
            }
        }

        stop() {
            [this.xDeltaStop, this.yDeltaStop] = [this.xDelta, this.yDelta];

            this.i = 0;
            this.timerId.run_dispose();
            this.timerId = new Clutter.Timeline({ duration: CLUTTER_TIMELINE_DURATION });
            this.timerId.connect('new-frame', this.on_stop_tick_elapsed.bind(this));
            this.timerId.start();        
        }

        on_stop_tick_elapsed() {
            this.i++;
    
            this.xDelta = this.xDeltaStop * Math.sin(this.i) / Math.exp(this.i / 4, 2);
            this.yDelta = this.yDeltaStop * Math.sin(this.i) / Math.exp(this.i / 4, 2);
            this.yDeltaStretch = this.yDelta;

            this.invalidate();
            this.parentActor.queue_redraw();

            return true;
        }

        partial_redraw(xSize, ySize, redrawLeft, redrawRight, redrawTop, redrawBottom) {
            if (this.parentActor) {
                if (redrawLeft) {
                    this.parentActor.queue_redraw_with_clip(new cairo.RectangleInt({
                        x: this.xNew - X_CLEAN_MARGIN - (xSize + X_CLEAN_EXTRA_DELTA) * X_CLEAN_SIZE, 
                        y: this.yNew - Y_CLEAN_MARGIN, 
                        width: (xSize + X_CLEAN_EXTRA_DELTA) * X_CLEAN_SIZE, 
                        height: this.height + Y_CLEAN_MARGIN * 2
                    }));
                }
                if (redrawRight) {
                    this.parentActor.queue_redraw_with_clip(new cairo.RectangleInt({
                        x: this.xNew + this.width + X_CLEAN_MARGIN, 
                        y: this.yNew - Y_CLEAN_MARGIN, 
                        width: (xSize + X_CLEAN_EXTRA_DELTA) * X_CLEAN_SIZE, 
                        height: this.height + Y_CLEAN_MARGIN * 2
                    }));
                } 
                if (redrawTop) {
                    this.parentActor.queue_redraw_with_clip(new cairo.RectangleInt({
                        x: this.xNew - X_CLEAN_MARGIN - (xSize + X_CLEAN_EXTRA_DELTA) * X_CLEAN_SIZE, 
                        y: this.yNew - Y_CLEAN_MARGIN - (ySize + Y_CLEAN_EXTRA_DELTA) * Y_CLEAN_SIZE, 
                        width: this.width + X_CLEAN_MARGIN * 2 + xSize * X_CLEAN_SIZE * 2, 
                        height: (ySize + Y_CLEAN_EXTRA_DELTA) * Y_CLEAN_SIZE
                    }));           
                }       
                if (redrawBottom) {
                    this.parentActor.queue_redraw_with_clip(new cairo.RectangleInt({
                        x: this.xNew - X_CLEAN_MARGIN - (xSize + X_CLEAN_EXTRA_DELTA) * X_CLEAN_SIZE, 
                        y: this.yNew + Y_CLEAN_MARGIN + this.height, 
                        width: this.width + X_CLEAN_MARGIN * 2 + (xSize + X_CLEAN_EXTRA_DELTA) * X_CLEAN_SIZE * 2, 
                        height: (ySize + Y_CLEAN_EXTRA_DELTA) * Y_CLEAN_SIZE
                    }));
                }  
            }
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
        
            if (this.initOldValues) {
                let [xMouse, yMouse] = global.get_pointer();

                [this.xOld, this.yOld] = [this.xNew, this.yNew];
                [this.xPickedUp, this.yPickedUp] = [xMouse - this.xNew, yMouse - this.yNew];

                this.initOldValues = false;
            }

            this.partial_redraw(Math.abs(this.xDelta), Math.abs(this.yDelta), this.xDelta <= 0, this.xDelta >= 0, this.yDelta <=0, this.yDelta >= 0);
            
            this.xDelta += (this.xOld - this.xNew) * X_MULTIPLIER;
            this.yDelta += (this.yOld - this.yNew) * Y_MULTIPLIER;
            this.yDeltaStretch += (this.yOld - this.yNew) * Y_STRETCH_MULTIPLIER;

            [this.xOld, this.yOld] = [this.xNew, this.yNew];            
        }

        on_tick_elapsed() {
            this.xDelta /= RESTORE_X_FACTOR;
            this.yDelta /= RESTORE_Y_FACTOR;
            this.yDeltaStretch /= RESTORE_Y_STRETCH_FACTOR;
            
            this.invalidate();

            this.i++;
            if (this.i % 300 == 0) {
                this.parentActor.queue_redraw();
                this.i=0;
            } else if ((Math.abs(this.xDelta) < 80 && Math.abs(this.xDelta) > 20) || 
                    (Math.abs(this.yDelta) < 80 && Math.abs(this.yDelta) > 20)) {
                this.partial_redraw(80, 80, this.xDelta <= 0, this.xDelta >= 0, this.yDelta <=0, this.yDelta >= 0);
            }

            return true;
        }
        
        vfunc_deform_vertex(w, h, v) {
            v.x += this.xDelta * (h - h * Math.cos(Math.PI / 2 / h * v.y)) / h;

            v.y += 
                (
                    this.xPickedUp >= w / 3 && this.xPickedUp <= w * 2 / 3 ? v.y * this.yDeltaStretch / h : 0
                ) +
                this.yDelta +
                (
                    this.xPickedUp < w / 3 ? -Math.pow(w - v.x,2) :
                    this.xPickedUp > w * 2 / 3 ? -Math.pow(v.x,2) :
                    2 * Math.pow(w/2 - v.x,2) -(w * w * h)/(h - v.y)
                ) *
                this.yDelta *
                (h - v.y) / 
                (w * w * h);
        }

    }
);
        
var ResizeEffect = GObject.registerClass({},
    class ResizeEffect extends AbstractCommonEffect {

        _init(params = {}) {
            super._init(params);
        }

        on_actor_event(actor, allocation, flags) {
            [this.xNew, this.yNew] = global.get_pointer();

            if (this.initOldValues) {
                let [xWin, yWin] = actor.get_position();

                [this.xOld, this.yOld] = [this.xNew, this.yNew];
                [this.xPickedUp, this.yPickedUp] = [this.xNew - xWin, this.yNew - yWin];
                
                this.initOldValues = false;     
            }

            this.xDelta += (this.xOld - this.xNew) * X_MULTIPLIER;
            this.yDelta += (this.yOld - this.yNew) * Y_MULTIPLIER;
            this.yDeltaStretch += (this.yOld - this.yNew) * Y_STRETCH_MULTIPLIER;

            [this.xOld, this.yOld] = [this.xNew, this.yNew];            
        }

        on_tick_elapsed() {
            this.i++;
            this.parentActor.queue_redraw();
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
                    v.y += this.yDelta * (h - v.y) * Math.pow(v.x - this.xPickedUp, 2) / (Math.pow(w, 2)* h);
                    break;                
            }
        }

    }
);

var MinimizeMaximizeEffect = GObject.registerClass({},
    class MinimizeMaximizeEffect extends AbstractCommonEffect {

        _init(params = {}) {
            super._init(params);
        }

        on_actor_event(actor, allocation, flags) {}

        on_tick_elapsed() {
            this.i++;

            this.xDelta = 300 * Math.sin(this.i) / Math.exp(this.i / 4, 2);
            this.yDelta = 300 * Math.sin(this.i) / Math.exp(this.i / 4, 2);
        
            this.invalidate();
            this.parentActor.queue_redraw();
        
            return true;
        }
        
        vfunc_deform_vertex(w, h, v) {
            v.x += this.xDelta * (v.x - w/2) * v.y / (h * w);
            v.y += this.yDelta * (v.y - h/2) * v.x / (w * h);
        }

    }
);