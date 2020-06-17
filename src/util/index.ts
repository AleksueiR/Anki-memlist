/**
 * Represents a non id when no valid id is set.
 */
export const NON_ID = -1;

/**
 * Clone the provided array, return the provided value from it and return the clone.
 *
 * @export
 * @template T
 * @param {T[]} array
 * @param {T} value
 * @returns {T[]}
 */
export function removeFromArrayByValue<T>(array: T[], value: T): T[] {
    const arrayClone = [...array];
    const index = arrayClone.indexOf(value);
    arrayClone.splice(index, 1);

    return arrayClone;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function reduceArrayToObject<T extends { [name: string]: any }>(objects: T[], key = 'id') {
    return objects.reduce<Record<string, T>>((map, object) => ((map[`${object[key]}`] = object), map), {});
}

/**
 * Filter out null/undefined from an array.
 * https://stackoverflow.com/a/46700791
 *
 * @export
 * @template TValue
 * @param {(TValue | null | undefined)} value
 * @returns {value is TValue}
 */
export function notEmptyFilter<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}
