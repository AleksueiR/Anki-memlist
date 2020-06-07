import { PluginObject, PluginFunction } from 'vue';
import _Vue, { VNodeDirective, VNode } from 'vue';

export type DragTags = { [name: string]: any } | null;

export interface DragObject {
    event: MouseEvent;
    /**
     * The original node provided to the `drag-object` directive.
     *
     * @type {HTMLElement}
     * @memberof DragObject
     */
    node: HTMLElement;

    /**
     * Clone of the original `drag-object` node provided to the `drag-object` directive.
     *
     * @type {HTMLElement}
     * @memberof DragObject
     */
    clone: HTMLElement;

    /**
     * The data item being dragged.
     *
     * @type {*}
     * @memberof DragObject
     */
    payload?: any;
    tags?: DragTags;
}

export interface DragTarget {
    node: HTMLElement;

    /**
     * The data target item.
     *
     * @type {*}
     * @memberof DragTarget
     */
    payload?: any;
    tags?: DragTags;
}

/**
 * `drag-object` direction properties.
 *
 * @interface DragObjectBindingValue
 */
interface DragObjectBindingValue {
    /**
     * HTMLElement to be cloned and used as the drag element. If not supplied, the node of the `drag-object` direction will be used.
     *
     * @type {HTMLElement}
     * @memberof DragTarget
     */
    node: HTMLElement | null;

    /**
     * The data item being dragged. It's passed to the plugin and will not respond to binding changes after the drag has started.
     *
     * @type {object}
     * @memberof DragObjectBindingValue
     */
    payload?: object;
    onDown?: (event: MouseEvent, object: DragObject) => boolean | null;
    onStart?: (event: MouseEvent, object: DragObject) => null;
    onMove?: (event: MouseEvent, object: DragObject) => null;
    onStop?: (event: MouseEvent, object: DragObject) => null;
    tags?: DragTags;
}

interface DragTargetBindingValue {
    /**
     * The data item provided to the `drag-target` directive. It is passed as part of the `DragTarget` argument to the `onOver/onOut/onDrop` callbacks
     *
     * @type {object}
     * @memberof DragTargetBindingValue
     */
    payload?: object;
    onOver?: (event: MouseEvent, object: DragObject, target: DragTarget) => boolean | void;
    onOut?: (event: MouseEvent, object: DragObject, target: DragTarget) => null;
    onDrop: (event: MouseEvent, object: DragObject, target: DragTarget) => null;
    tags?: { [name: string]: any } | null;
}

// only one item can be dragged at a time
let dragObject: DragObject | null = null;

function isFunction(f: any): f is Function {
    return f instanceof Object;
}

const plugin: PluginFunction<null> = (Vue: typeof _Vue) => {
    Vue.directive('drag-object', {
        inserted(el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode): void {
            const options: DragObjectBindingValue = binding.value;
            const dragParent: Node = el.parentNode!;

            let dragObjectCandidate: DragObject | null = null;

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

                // prevent text from being selected when dragging
                event.preventDefault();

                // create a drag object
                dragObjectCandidate = {
                    event: event,
                    node: options.node,
                    clone: options.node.cloneNode(true) as HTMLElement,
                    payload: options.payload,
                    tags: options.tags
                };

                // execute `onDown` callback; if it didn't return `true`, do not start the drag operation
                if (isFunction(options.onDown) && !options.onDown(event, dragObjectCandidate)) {
                    return;
                }

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

                if (!dragObjectCandidate) {
                    return;
                }

                const [x, y] = [
                    dragObjectCandidate.event.pageX - event.pageX,
                    dragObjectCandidate.event.pageY - event.pageY
                ];
                const c = Math.sqrt(x * x + y * y);

                // if move of 3 pixels detected, start drag
                if (c > 3) {
                    stopDragDetection();
                    dragObject = dragObjectCandidate;
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

                if (!dragObject) {
                    return;
                }

                const bbox = dragObject.node.getBoundingClientRect();
                // offset from the left upper corner of the draggable element to the mouse cursor at the moment when the drag operation started
                const dragObjectOffset: { left: number; top: number } = {
                    left: event.pageX - bbox.left,
                    top: event.pageY - bbox.top
                };

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

                dragParent.appendChild(dragObject.clone);

                if (isFunction(options.onStart)) {
                    options.onStart(event, dragObject);
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

                if (!dragObject) {
                    return;
                }

                document.removeEventListener('mouseup', stopDrag);
                document.removeEventListener('mousemove', moveDrag);

                dragObject.clone.classList.remove('drag-object-active');

                if (isFunction(options.onStop)) {
                    options.onStop(event, dragObject);
                }

                // check if the drag parent still has the drag clone; it might have been removed by `onStop`, `onDrop` or other callbacks
                if (dragParent.contains(dragObject.clone)) {
                    // remove the clone from the DOM
                    // el itself might be removed from the dom by this point
                    dragParent.removeChild(dragObject.clone);
                }

                dragObject = null;
            }

            /**
             * Reposition the drag object clone as the mouse cursor moves.
             *
             * @param {MouseEvent} event
             */
            function moveDrag(event: MouseEvent) {
                console.log('drag moves');

                if (!dragObject) {
                    return;
                }

                dragObject.clone.style.transform = `translate(${event.pageX}px, ${event.pageY}px)`;

                if (isFunction(options.onMove)) {
                    options.onMove(event, dragObject);
                }
            }
        }
    });

    Vue.directive('drag-target', {
        inserted(el: HTMLElement, binding: VNodeDirective, vnode: VNode, oldVnode: VNode): void {
            const options: DragTargetBindingValue = binding.value;
            const dragTarget: DragTarget = { node: el, tags: options.tags, payload: options.payload };

            // TODO: [performance] register drag targets and only activate them then when a drag detected
            el.addEventListener('mouseover', startDropDetection);
            el.addEventListener('mouseup', dropObject);
            el.addEventListener('mouseout', stopDropDetection);

            /**
             * Activate the drop detection when the drag object is moved over a target. Call `onOver` target callback.
             *
             * @param {MouseEvent} event
             * @returns {void}
             */
            function startDropDetection(event: MouseEvent): void {
                if (!dragObject) {
                    return;
                }

                console.log('target over');

                dragTarget.node.classList.add('drag-target-active');

                if (isFunction(options.onOver)) {
                    options.onOver(event, dragObject, dragTarget);
                }
            }

            /**
             * Perform the drop - call `onDrop` target callback - and stop drop detection.
             *
             * @param {MouseEvent} event
             * @returns {void}
             */
            function dropObject(event: MouseEvent): void {
                if (!dragObject) {
                    return;
                }

                console.log('target drop');

                // if (isFunction(options.onDrop)) {
                // NOTE: `onDrop` is requered, otherwise what is the point?
                options.onDrop(event, dragObject, dragTarget);
                // }

                stopDropDetection(event);
            }

            /**
             * Deactivate the drop target when the drag object is moved out of it. Call `onOut` target callback.
             *
             * @param {MouseEvent} event
             * @returns {void}
             */
            function stopDropDetection(event: MouseEvent): void {
                if (!dragObject) {
                    return;
                }

                console.log('target out');

                dragTarget.node.classList.remove('drag-target-active');

                if (isFunction(options.onOut)) {
                    options.onOut(event, dragObject, dragTarget);
                }
            }
        }
    });
};

export default plugin;
