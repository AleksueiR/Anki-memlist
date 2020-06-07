export function removeFromArrayByValue<T>(array: T[], value: T): T[] {
    const arrayClone = [...array];
    const index = arrayClone.indexOf(value);
    arrayClone.splice(index, 1);
    return arrayClone;
}

export function reduceArrayToObject<T extends { [name: string]: any }>(objects: T[], key = 'id') {
    return objects.reduce<Record<number, any>>((map, object) => ((map[object[key]] = object), map), {});
}
