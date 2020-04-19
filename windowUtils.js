'use strict';

const { GObject, Clutter, Meta } = imports.gi;

const DURATION = 1000 * 1000;
const RESTORE_X_FACTOR = 1.3;
const RESTORE_Y_FACTOR = 1.3;
const X_MULTIPLIER = 1.1;
const Y_MULTIPLIER = 1.1;
const X_MULTIPLIER_RESIZE = 0.3;
const Y_MULTIPLIER_RESIZE = 0.3;
const RADIUS = 100;
// const BOUNCE_ENABLED = true;

var WobblyEffect = GObject.registerClass({}, 
    class WobblyEffect extends Clutter.DeformEffect {
        
        _init(params = {}) {
            super._init();

            this.parentActor = null;
            this.operationType = params.op;
            this.stop = false;
            this.timerId = null;
            this.initOldValues = true;
            this.xOld = null;
            this.yOld = null;
            this.xDelta = 0;
            this.yDelta = 0;
            this.xPickedUp = 0;
            this.yPickedUp = 0;
            this.width = 0;
            this.height = 0;
            this.i = 0;
        }

        vfunc_set_actor (actor) {
            if (actor) {
                super.vfunc_set_actor(actor);
                this.parentActor = actor.get_parent();
                
                actor.connect('allocation-changed', this.on_actor_event.bind(this))

                this.timerId = new Clutter.Timeline({ duration: DURATION });
                this.timerId.connect('new-frame', this.on_tick_elapsed.bind(this));
                this.timerId.start();
            }
        }

        destroy () {
            if (this.timerId) {
                this.timerId.run_dispose();
                this.timerId = null;
            }

            let actor = this.get_actor();
            if (actor) {
                actor.remove_effect(this);
            }
        }

        on_stop() {
            this.stop = true;      
        }        

        on_actor_event (actor, allocation, flags) {     
            let [width, height] = actor.get_size();
            let [xWin, yWin] = actor.get_position();
            let [xNew, yNew] = global.get_pointer();

            if (this.initOldValues) {
                this.xOld = xNew;
                this.yOld = yNew;          
                this.xPickedUp = xNew - xWin;
                this.yPickedUp = yNew - yWin;
                this.initOldValues = false;     
            }
            
            if (Meta.GrabOp.MOVING == this.operationType) {
                this.xDelta += (this.xOld - xNew) * X_MULTIPLIER;
                this.yDelta += (this.yOld - yNew) * Y_MULTIPLIER;
            } else {
                this.xDelta += (this.xOld - xNew) * X_MULTIPLIER_RESIZE;
                this.yDelta += (this.yOld - yNew) * Y_MULTIPLIER_RESIZE;
            } 

            this.xOld = xNew;
            this.yOld = yNew;
            this.width = width;
            this.height = height;

            this.i = 0;
        }

        on_tick_elapsed () {
            // this.i++;

            // if (this.stop) {
            //     this.xDelta = this.xDelta / RESTORE_X_FACTOR - (BOUNCE_ENABLED ? this.width * Math.cos(this.i / 2) / (this.i * 25) : 0);
            //     this.yDelta = this.yDelta / RESTORE_Y_FACTOR - (BOUNCE_ENABLED ? this.height * Math.cos(this.i / 2) / (this.i * 25) : 0);
            // } else if (Meta.GrabOp.MOVING == this.operationType) {
            //     this.xDelta /= RESTORE_X_FACTOR;
            //     this.yDelta /= RESTORE_Y_FACTOR;            
            // }

            if (this.stop || Meta.GrabOp.MOVING == this.operationType) {
                this.xDelta /= RESTORE_X_FACTOR;
                this.yDelta /= RESTORE_Y_FACTOR;
            }

            this.invalidate();
            this.parentActor.queue_redraw();
        }

        vfunc_deform_vertex (w, h, v) {
            let x = v.x, 
                y = v.y;

            switch (this.operationType) {
                case Meta.GrabOp.MOVING:
                    v.x += this.xDelta * (this.xDelta > 0 ? x + (w - x) * 1.5 : x * 1.5 + (w - x)) * Math.pow(y, 2) / (Math.pow(h, 2) * w);

                    if (this.xPickedUp <= w / 3) {
                        v.y -= this.yDelta * Math.pow(w - x, 2) / Math.pow(w, 2) - this.yDelta;
                    } else if ( this.xPickedUp <= w * 2 / 3) {
                        v.y += this.yDelta * Math.pow(x - this.xPickedUp, 2) / Math.pow(this.xPickedUp, 2);
                    } else {
                        v.y -= this.yDelta * Math.pow(x, 2) / Math.pow(w, 2) - this.yDelta;
                    }
                    
                    break;                  

                case Meta.GrabOp.RESIZING_NW:
                    v.x += this.xDelta * (w - x) * Math.pow(y, 2) / (Math.pow(h, 2) * w);
                    v.y +=  this.yDelta * (h - y) * Math.pow(x, 2) / (Math.pow(w, 2) * h);  
                    break;
                    
                case Meta.GrabOp.RESIZING_NE:
                    v.x += this.xDelta * x * Math.pow(y, 2) / (Math.pow(h, 2) * w);
                    v.y += this.yDelta * (h - y) * Math.pow(w - x, 2) / (Math.pow(w, 2) * h);    
                    break;

                case Meta.GrabOp.RESIZING_SE:
                    v.x += this.xDelta * x * Math.pow(h - y, 2) / (Math.pow(h, 2) * w);
                    v.y += this.yDelta * y * Math.pow(w - x, 2) / (Math.pow(w, 2) * h);    
                    break;

                case Meta.GrabOp.RESIZING_SW:
                    v.x += this.xDelta * (w - x) * Math.pow(h - y, 2) / (Math.pow(h, 2) * w);
                    v.y -= this.yDelta * y * Math.pow(w - x, 2) / (Math.pow(w, 2) * h);
                    break;
                
                case Meta.GrabOp.RESIZING_W:
                    v.x += this.xDelta * (w - x) * Math.pow(y - this.yPickedUp, 2) / (Math.pow(h, 2) * w);
                    break;

                case Meta.GrabOp.RESIZING_E:
                    v.x += this.xDelta * x * Math.pow(y - this.yPickedUp, 2) / (Math.pow(h, 2) * w);
                    break;

                case Meta.GrabOp.RESIZING_S:
                    v.y += this.yDelta * y * Math.pow(x - this.xPickedUp, 2) / (Math.pow(w, 2) * h);
                    break;

                case Meta.GrabOp.RESIZING_N:
                    v.y += this.yDelta * (h - y) * Math.pow(x - this.xPickedUp, 2) / (Math.pow(w, 2)* h);
                    break;
            }
        }    
    }
);