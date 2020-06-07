import { VNodeDirective } from 'vue';

export const StayInView = {
    // When the bound element is inserted into the DOM...
    componentUpdated: (element: HTMLElement, binding: VNodeDirective) => {
        if (!binding.value) {
            return;
        }

        // console.log('update', element, binding);

        // console.log('update', getOffset(element, element.parentElement!));

        const { elementRect, containerRect, offset } = getOffset(element, element.parentElement!);
        let offsetDelta = 0;
        if (offset.top < 0) {
            offsetDelta = offset.top;
        } else if (offset.top + elementRect.height > containerRect.height) {
            offsetDelta = offset.top + elementRect.height - containerRect.height;
        }

        if (offsetDelta !== 0) {
            element.parentElement!.scrollTop += offsetDelta;
        }

        function getOffset(element: HTMLElement, container: HTMLElement) {
            const elementRect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            return {
                elementRect,
                containerRect,
                offset: {
                    top: elementRect.top - containerRect.top,
                    left: elementRect.left - containerRect.left
                }
            };
        }
    } /* ,
    componentUpdated: (element: HTMLElement, binding: any) => {
        console.log('componentUpdated', element, binding);
    } */
};
