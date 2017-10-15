import Vue from 'vue';

const SECTION_CREATED = 'section-created';
const SECTION_MOUNTED = 'section-mounted';

const CHART_CONFIG_UPDATED = 'chart-config-updated';

export const EventBus = new Vue();
export {
    SECTION_CREATED,
    SECTION_MOUNTED,

    CHART_CONFIG_UPDATED
}