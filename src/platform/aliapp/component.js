// @jgb-ignore
import { createSelectorQuery } from './wxml/createSelectorQuery'
import { defineProperty } from '../../utils/index'
/**
 * 适配微信小程序Component参数的组件方法
 * @param {*} opts 
 */
export default function AdapterAliappComponent(opts, InjectComponent = Component) {
  // behaviors => mixins
  if (opts.behaviors) {
    opts.mixins = opts.behaviors
    delete opts.behaviors;
  }

  opts = AdapterComponent(opts)

  InjectComponent(opts)
}

export function AdapterComponent(opts) {
  // 新的生命周期声明方式
  const lifetimes = opts.lifetimes || {};
  // 生命周期函数
  const lifetimeMethods = ['created', 'attached', 'ready', 'moved', 'detached']

  // foreach lifetimes and add highpriority lifetimes
  lifetimeMethods.forEach(key => {
    const fn = opts[key]
    const highLevelFn = lifetimes[key]
    if (typeof highLevelFn === 'function') {
      opts[key] = function(...args) {
        highLevelFn.apply(this, args);
        typeof fn === 'function' && fn.apply(this, args);
      }
    }
  })

  // lifetimes methods
  let {created, attached, ready, moved, detached} = opts;

  // remove lifetimes methods
  delete opts.lifetimes;
  lifetimeMethods.forEach(key => {
    delete opts[key]
  })

  /* 存放需要observer的方法 */
  const observers = []

  /** 为自定义组件更新后的回调，每次组件数据变更的时候都会调用。  */
  opts.didUpdate = function didUpdate(prevProps) {
    const props = this.props || {}
    Object.keys(props).forEach(key => {
      const oldVal = prevProps[key]
      const newVal = props[key]
      if (newVal !== oldVal) {
        const o = observers.find(o => o.key === key)
        if (o) {
          o.observer.call(this, newVal, oldVal, [key])
        }
      }
    })
  }

  /** 为自定义组件被卸载后的回调，每当组件示例从页面卸载的时候都会触发此回调。  */
  opts.didUnmount = function didUnmount() {
    detached && detached.call(this)
  }

  /** 为自定义组件首次渲染完毕后的回调，此时页面已经渲染，通常在这时请求服务端数据比较合适。  */
  opts.didMount = function didMount() {
    extendInstance.call(this)

    created && created.call(this)
    attached && attached.call(this)
    ready && ready.call(this)
  }

  // properties => props
  if (opts.properties) {
    const props = {}
    Object.keys(opts.properties).forEach(key => {
      let defaultValue = opts.properties[key]
      if (typeof defaultValue === 'function') {
        defaultValue = new defaultValue()
      } else {
        const {type, value, observer} = defaultValue
        defaultValue = value;
        if (observer) {
          observers.push({
            key,
            observer
          })
        }
      }
      props[key] = defaultValue
    })

    opts.props = props

    delete opts.properties;
  } else {
    opts.props = {}
  }

  const fns = getOptionsTriggerEvent(opts);
  if (fns && fns.length) {
    fns.forEach(({eventName}) => {
      opts.props.eventName = (data) => console.log(data)
    })
  }

  return opts;
}

const MATCH_BIND_FUNC = /bind([a-zA-Z0-9]+)/
const MATCH_TRIGGEREVENT_PARAMS = /this\.triggerEvent\((.+)\)/g

/**
 * 扩展实例属性
 * @param {*} ctx 
 */
function extendInstance(ctx) {
  // 适配微信小程序属性
  if (!this.properties) {
    Object.defineProperty(this, 'properties', {
      get() {
        return this.props
      }
    })

    defineProperty(this, 'createSelectorQuery', () => createSelectorQuery({
      context: this
    }))

    defineProperty(this, 'triggerEvent', triggerEvent)

    Object.defineProperty(this, 'id', {
      get() {
        return this.props.id || this.$id
      }
    })

    defineProperty(this, 'selectAllComponents', selectAllComponents)

    defineProperty(this, 'selectComponent', selectComponent)

    cannotAchieveComponentInstanceFunctions(this);
  }
}

function triggerEvent(eventName, data) {
  const name = processEventName(eventName)
  const fn = this.props[name]
  if (typeof fn !== 'function') {
    console.warn(`triggerEvent [${eventName}] is not a function`)
    return
  }
  fn(data)
// fn.call(this, data)
}



/**
 * 获取opts中所有的方法并遍历取出 this.triggerEvent('eventName') 中 eventName
 * @param {*} opts 
 */
function getOptionsTriggerEvent(opts = {}) {
  // 需要trigger的方法
  const fns = []
  const eventNames = new Set()
  eachOptions([opts, opts.methods || {}], (fn) => {
    const fnStr = fn.toString()
    // this.triggerEvent('customevent', {}) => 'customevent', {}
    let matchParams;
    while ((matchParams = MATCH_TRIGGEREVENT_PARAMS.exec(fnStr)) !== null) {
      if (!matchParams) return;
      // 'customevent', {} => ['customevent', {}]
      const params = matchParams[1].split(',')
      let [eventName] = params
      // eventName like 'customevent' so we need remove quotes
      eventName = eventName.replace(/['"]/g, '');
      if (eventNames.has(eventName)) return;
      eventNames.add(eventName)
      fns.push({
        eventName: processEventName(eventName)
      })
    }
  })
  return fns
}

/**
 * 
 * @param {*} selector #id or .selector
 */
export function selectAllComponents(selector) {
  // this.$page 为 Component中对当前页面的实例
  const $page = this.$page || this
  const results = []
  if (!$page.$getComponentBy) {
    return []
  }

  // 支付宝内部查询所有节点
  $page.$getComponentBy((result) => {
    results.push(result)
  })

  // 等待
  return results.filter(r => {
    const id = r.props.id;
    const classNames = (r.props.className || '').split(' ').filter(s => !!s);
    if (selector.startsWith('#') && `#${id}` === selector) {
      return true
    }

    if (selector.startsWith('.') && classNames.length) {
      if (classNames.filter(className => `.${className}` === selector).length) {
        return true
      }
    }

    return false
  })
}

export function selectComponent(selector) {
  const components = selectAllComponents(selector);
  return components.length ? components[0] : []
}

function cannotAchieveComponentInstanceFunctions(ctx) {
  const functionNames = ['hasBehavior', 'createIntersectionObserver' /* , 'selectComponent', 'selectAllComponents' */ , 'getRelationNodes', 'groupSetData']

  functionNames.forEach(name => {
    const method = createNotAchievedMethod(name)
    defineProperty(ctx, name, method)
  })
}

function createNotAchievedMethod(name) {
  return () => {
    console.warn('can not achieve method: ' + name)
  }
}

function eachOptions(opts, callback) {
  [].concat(opts).forEach((opt) => {
    const keys = Object.keys(opt)
    keys.forEach(key => {
      const fn = opt[key]
      if (typeof fn !== 'function') return;
      callback(fn)
    })
  })
}

/**
 * > 微信自定义组件事件 bindmyevent or bind:myevent 
 * > 触发事件 this.triggerEvent('myevent')
 * > 支付宝：外部使用自定义组件时，如果传递的参数是函数，一定要要以 on 为前缀，否则会将其处理为字符串。
 * @param {*} eventName 
 */
function processEventName(eventName) {
  // bindtap => onTap
  // tap => onTap
  if (eventName.startsWith('bind') || !eventName.startsWith('on')) {
    return eventName.replace(/^(bind){0,1}(.*)/, (g, $1, $2) => {
      return `on${$2[0].toUpperCase()}${$2.slice(1)}`
    })
  }
  return eventName
}