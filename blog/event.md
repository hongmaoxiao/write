2个多月前把 Github 上的 [eventemitter3](https://github.com/primus/eventemitter3) 和 Node.js 下的事件模块 [events](https://github.com/nodejs/node/blob/master/lib/events.js) 的源码抄了一遍，才终于对 JavaScript 事件有所了解。

上个周末花点时间根据之前看源码的理解自己用 ES6 写了一个 [eventemitter8](https://github.com/hongmaoxiao/eventemitter8)，然后也发布到 [npm](https://www.npmjs.com/package/eventemitter8) 上了，让我比较意外的是才发布两天在没有 `readme` 介绍，没有任何宣传的情况下居然有45个下载量，我很好奇都是谁下载的，会不会用。我花了不少时间半抄半原创的一个 JavaScript 时间处理库 [now.js](https://github.com/hongmaoxiao/now) (`npm` 传送门：[now.js](https://www.npmjs.com/package/now.js)) ，在我大力宣传的情况下，4个月的时间下载量才[177](https://npm-stat.com/charts.html?package=now.js&from=2017-10-16&to=2018-03-14)。真是有心栽花花不开，无心插柳柳成荫！

`eventemitter8` 大部分是我自己根据看源码理解后写出来的，有一些方法如`listeners`，`listenerCount` 和 `eventNames` 一下子想不起来到底是要做什么，回头重查。测试用例不少是参考了 `eventemitter3`，在此对 `eventemitter3` 的开发者和 `Node.js` 事件模块的开发者表示感谢！

下面来讲讲我对 JavaScript 事件的理解：

从上图可以看出，JavaScript 事件最核心的包括事件监听 (addListener)、事件触发 (emit)、事件删除 (removeListener)。

### 事件监听(addListener)
首先，监听肯定要有监听的目标，或者说是对象，那为了达到区分目标的目的，名字是不可少的，这里定义为 `name`。其次，监听的目标一定要有某种动作，对应到 JavaScript 里实际上就是某种方法，这里定义为 `fn`。譬如可以监听一个 `name` 为 `add`，方法为某一个变量 `a` 值加`1`的方法 `fn = () => a + 1`的事件。如果我们还想监听一个使变量 `b` 加`2`的方法，我们第一反应可能是创建一个 `name` 为 `add2`，方法 为 `fn2 = () => b + 2` 的事件。你可能会想，这太浪费了，我能不能只监听一个名字，让它执行多于一个方法的事件。当然是可以的，那么怎么做呢？很简单，把监听的方法放在一个数组里，遍历数组顺序执行就可以了。以上例子变为 `name` 为 `add`，方法为`[fn, fn2]`。
如果要细分的话还可以分为可以无限次执行的事件 `on` 和 只允许执行一次的事件 `once` (执行完后立即该事件删除)。后边会细讲。

### 事件触发(emit)
单有事件监听是没有用的，必须还要有事件触发，才能算完成整个过程。`emit` 就是去触发监听的特定 `name` 对应的单个事件，或者一系列事件。拿前面的例子来说单个事件就是去执行 `a`加`1`，一系列事件就是去遍历执行 `a` 加`1`和 `b` 加`2`。

### 事件删除(removeListener)
严格意义上来说，事件监听和事件触发已经能完成整个过程了。有没有事件删除都是无所谓的。但是很多时候，我们还是需要事件删除的。比如前面讲的只允许执行一次的事件 `once`，如果不提供删除方法，很难保证你什么时候会再次执行它。严格意义上来说，只要是不再需要的事件，我们都应该去删除它。

核心部分讲完，下面简单的对 `eventemitter8`的源码进行简单解析。

### 源码解析
附上源码:
```javascript
const toString = Object.prototype.toString;
const isType = obj => toString.call(obj).slice(8, -1).toLowerCase();
const isArray = obj => Array.isArray(obj) || isType(obj) === 'array';
const isNullOrUndefined = obj => obj === null || obj === undefined;

const _addListener = function(type, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }

  fn.context = context;
  fn.once = !!once;

  const event = this._events[type];
  // only one, let `this._events[type]` to be a function
  if (isNullOrUndefined(event)) {
    this._events[type] = fn;
  } else if (typeof event === 'function') {
    // already has one function, `this._events[type]` must be a function before
    this._events[type] = [event, fn];
  } else if (isArray(event)) {
    // already has more than one function, just push
    this._events[type].push(fn);
  }

  return this;
};

class EventEmitter {
  constructor() {
    if (this._events === undefined) {
      this._events = Object.create(null);
    }
  }

  addListener(type, fn, context) {
    return _addListener.call(this, type, fn, context);
  }

  on(type, fn, context) {
    return this.addListener(type, fn, context);
  }

  once(type, fn, context) {
    return _addListener.call(this, type, fn, context, true);
  }

  emit(type, ...rest) {
    if (isNullOrUndefined(type)) {
      throw new Error('emit must receive at lease one argument');
    }

    const events = this._events[type];

    if (isNullOrUndefined(events)) return false;

    if (typeof events === 'function') {
      events.call(events.context || null, rest);
      if (events.once) {
        this.removeListener(type, events);
      }
    } else if (isArray(events)) {
      events.map(e => {
        e.call(e.context || null, rest);
        if (e.once) {
          this.removeListener(type, e);
        }
      });
    }

    return true;
  }

  removeListener(type, fn) {
    if (isNullOrUndefined(this._events)) return this;

    // if type is undefined or null, nothing to do, just return this
    if (isNullOrUndefined(type)) return this;

    if (typeof fn !== 'function') {
      throw new Error('fn must be a function');
    }

    const events = this._events[type];

    if (typeof events === 'function') {
      events === fn && delete this._events[type];
    } else {
      const findIndex = events.findIndex(e => e === fn);

      if (findIndex === -1) return this;

      // match the first one, shift faster than splice
      if (findIndex === 0) {
        events.shift();
      } else {
        events.splice(findIndex, 1);
      }

      // just left one listener, change Array to Function
      if (events.length === 1) {
        this._events[type] = events[0];
      }
    }

    return this;
  }

  removeAllListeners(type) {
    if (isNullOrUndefined(this._events)) return this;

    // if not provide type, remove all
    if (isNullOrUndefined(type)) this._events = Object.create(null);

    const events = this._events[type];
    if (!isNullOrUndefined(events)) {
      // check if `type` is the last one
      if (Object.keys(this._events).length === 1) {
        this._events = Object.create(null);
      } else {
        delete this._events[type];
      }
    }

    return this;
  }

  listeners(type) {
    if (isNullOrUndefined(this._events)) return [];

    const events = this._events[type];
    // use `map` because we need to return a new array
    return isNullOrUndefined(events) ? [] : (typeof events === 'function' ? [events] : events.map(o => o));
  }

  listenerCount(type) {
    if (isNullOrUndefined(this._events)) return 0;

    const events = this._events[type];

    return isNullOrUndefined(events) ? 0 : (typeof events === 'function' ? 1 : events.length);
  }

  eventNames() {
    if (isNullOrUndefined(this._events)) return [];

    return Object.keys(this._events);
  }
}

export default EventEmitter;
```
代码很少，只有151行，其实写的是简单版，且用的 `ES6`，所以才这么少；`Node.js`的事件和 `eventemitter3`可比这多且复杂不少，有兴趣可深入研究。