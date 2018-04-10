const getType = v => v === undefined ? 'undefined' : v === 'null' ? 'null' : v.constructor.name.toLowerCase();

console.log(getType(new Set([1, 2, 3])));
console.log(getType(new Array(1, 2, 3)));
console.log(getType(Object.create({a: 1})));
