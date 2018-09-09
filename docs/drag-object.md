only one element can be dragged at a time

Each `drag-object` listens to `mouse-down` and initializes a `drag-detection` process. 

Each `drag-target` 



```ts
interface DragObject {
  node: HTMLElement,
  clone: HTMLElement,
  payload: any,
  tags: {[name: string]: any }
}

interface DragTarget {
  node: HTMLElement,
  tags: {[name: string]: any }
}
```





### drag-object

Options:

```ts
node: HTMLelement,
down: (event, object: DragObject) => boolean,
tags: {[name: string]: any }
```



### drag-target

Options:

```ts
over: (event, object: DragObject, target: DragTarget, tags) => boolean,
out: (event, object, target) => void,
drop: (event, object, target) => void,
tags: {[name: string]: any }
```

