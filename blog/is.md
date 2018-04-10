## getType
> Returns the native type of a value.
>
> Returns lowercased constructor name of value, "undefined" or "null" if value is undefined or null.
> 
> ```javascript
> const getType = v => v === undefined ? 'undefined' : v === null ? 'null' : v.constructor.name.toLowerCase();
> ```

返回值的元类型。

返回值的 `constructor` 名的小写字母。`undefined` 或者 `null` 将会返回 `undefined` 或 `null`。

```javascript
❯ cat getType.js 
const getType = v => v === undefined ? 'undefined' : v === 'null' ? 'null' : v.constructor.name.toLowerCase();

console.log(getType(new Set([1, 2, 3])));
console.log(getType(new Array(1, 2, 3)));
console.log(getType(Object.create({a: 1})));

❯ node getType.js 
set
array
object
```
字面意思很好理解，不多说。

## is
> Checks if the provided value is of the specified type (doesn't work with literals).
>
> Use the instanceof operator to check if the provided value is of the specified type.
>
>```javascript
> const is = (type, val) => val instanceof type;
>```

检测 `val` 是否是指定的类型 `type` (对字面值不起作用)。

使用 `instanceof` 进行检测。

```javascript
const is = (type, val) => val instanceof type;
```