import { PluginObject, PluginFunction } from 'vue';
import _Vue, { VNodeDirective, VNode } from 'vue';

export type DragTags = { [name: string]: any } | null;

export interface DragObject {
    event: MouseEvent;
    node: HTMLElement;
    clone: HTMLElement;
    payload: any;
    tags: DragTags;
}

export interface DragTarget {
    node: HTMLElement;
    tags: DragTags;
}

interface DragObjectBindingValue {
    node: HTMLElement | null;
    payload: object;
    onDown: (event: MouseEvent, object: DragObject) => boolean | null;
    onLift: (event: MouseEvent, object: DragObject) => null;
    onMove: (event: MouseEvent, object: DragObject) => null;
    onStop: (event: MouseEvent, object: DragObject) => null;
    tags: DragTags;
}

interface DragTargetBindingValue {
    onOver: (event: MouseEvent, object: DragObject, target: DragTarget) => boolean | null;
    onOut: (event: MouseEvent, object: DragObject, target: DragTarget) => null;
    onDrop: (event: MouseEvent, object: DragObject, target: DragTarget) => null;
    tags: { [name: string]: any } | null;
}

// only one item can be dragged at a time
let dragObject: DragObject;

function isFunction(f: any): f is Function {
    return f instanceof Object;
}

const plugin: PluginFunction<null> = (Vue: typeof _Vue, options: null) => {
    Vue.directive('drag-object', {
        inserted(el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode): void {
            const options: DragObjectBindingValue = binding.value;

            // offset from the left upper corner of the draggable element to the mouse cursor at the moment when the drag operation started
            let dragObjectOffset: { left: number; top: number };

            el.addEventListener('mousedown', initDrag);

            /**
             * Initialize the drag event.
             *
             * @param {MouseEvent} event origin mousedown event
             * @returns
             */
            function initDrag(event: MouseEvent) {
                console.log('drag init');

                // if the drag node is not supplied in the directive's options, use the directive's own element
                if (!options.node) {
                    options.node = el;
                }

                if (isFunction(options.onDown) && !options.onDown(event, dragObject)) {
                    return;
                }

                // prevent text from being selected when dragging
                event.preventDefault();

                // create a drag object
                dragObject = {
                    event: event,
                    node: options.node,
                    clone: options.node.cloneNode(true) as HTMLElement,
                    payload: options.payload,
                    tags: options.tags
                };

                document.addEventListener('mousemove', startDragDetection);
                document.addEventListener('mouseup', stopDragDetection);
            }

            /**
             * Detect drag movement after the drag has been initialized.
             *
             * @param {MouseEvent} event mousemove event
             */
            function startDragDetection(event: MouseEvent): void {
                console.log('drag start detection');

                /* if (!this.dragOrigin) {
                    return;
                } */

                const [x, y] = [dragObject.event.pageX - event.pageX, dragObject.event.pageY - event.pageY];
                const c = Math.sqrt(x * x + y * y);

                // if move of 3 pixels detected, start drag
                if (c > 3) {
                    stopDragDetection();
                    startDrag(event);
                }
            }

            /**
             * Stop detecting the start of the drag event and clean up listeners.
             *
             */
            function stopDragDetection(): void {
                console.log('drag stop detection');

                document.removeEventListener('mousemove', startDragDetection);
                document.removeEventListener('mouseup', stopDragDetection);
            }

            /**
             * Start the drag operation, by adding the drag object clone to the drag object's parent and positioning it.
             *
             * @param {MouseEvent} event mousemove event
             */
            function startDrag(event: MouseEvent): void {
                console.log('drag started');

                const bbox = dragObject.node.getBoundingClientRect();

                dragObjectOffset = { left: event.pageX - bbox.left, top: event.pageY - bbox.top };

                document.addEventListener('mousemove', moveDrag);
                document.addEventListener('mouseup', stopDrag);

                dragObject.clone.style.position = 'fixed'; // fixed position ignores if the page is scrolled
                dragObject.clone.style.pointerEvents = 'none'; // the draggable clone no should be interfere with mouseover and other events
                dragObject.clone.style.left = `${-dragObjectOffset.left}px`;
                dragObject.clone.style.top = `${-dragObjectOffset.top}px`;
                dragObject.clone.style.width = `${dragObject.node.clientWidth}px`;
                dragObject.clone.style.height = `${dragObject.node.clientHeight}px`;
                dragObject.clone.style.zIndex = `${Number.MAX_SAFE_INTEGER}`; // set the maximum z-index possible
                dragObject.clone.classList.add('drag-object-active');

                el.parentNode!.appendChild(dragObject.clone);

                if (isFunction(options.onLift)) {
                    options.onLift(event, dragObject);
                }

                moveDrag(event);
            }

            /**
             * Stop the drag operation and remove the drag object clone from the DOM.
             *
             * @param {MouseEvent} event
             */
            function stopDrag(event: MouseEvent) {
                console.log('drag stopped');
                document.removeEventListener('mouseup', stopDrag);
                document.removeEventListener('mousemove', moveDrag);

                dragObject.clone.classList.remove('drag-object-active');

                if (isFunction(options.onStop)) {
                    options.onStop(event, dragObject);
                }

                // el.parentNode!.removeChild(dragObject.clone);
            }

            /**
             * Reposition the drag object clone as the mouse cursor moves.
             *
             * @param {MouseEvent} event
             */
            function moveDrag(event: MouseEvent) {
                console.log('drag moves');

                dragObject.clone.style.transform = `translate(${event.pageX}px, ${event.pageY}px)`;

                if (isFunction(options.onStop)) {
                    options.onMove(event, dragObject);
                }
            }
        }
    });

    Vue.directive('drag-target', {
        inserted(el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode): void {
            const options: DragTargetBindingValue = binding.value;
            const dragTarget: DragTarget = { node: el, tags: options.tags };

            el.addEventListener('mouseover', startDropDetection);
            el.addEventListener('mouseout', stopDropDetection);

            function startDropDetection(event: MouseEvent) {
                dragTarget.node.classList.add('drag-target-active');

                if (isFunction(options.onOver)) {
                    options.onOver(event, dragObject, dragTarget);
                }
            }

            function stopDropDetection(event: MouseEvent) {
                dragTarget.node.classList.remove('drag-target-active');

                if (isFunction(options.onOut)) {
                    options.onOut(event, dragObject, dragTarget);
                }
            }
        }
    });
};

export default plugin;
