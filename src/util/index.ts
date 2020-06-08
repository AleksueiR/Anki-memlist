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
