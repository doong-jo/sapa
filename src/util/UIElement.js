import EventMachine, { splitMethodByKeyword } from "./EventMachine";
import { uuid } from "./functions/func";

const REG_STORE_MULTI_PATTERN = /^ME@/;

const MULTI_PREFIX = "ME@";
const SPLITTER = "|";

export const PIPE = (...args) => {
  return args.join(SPLITTER);
};

export const EVENT = (...args) => {
  return MULTI_PREFIX + PIPE(...args);
};

/**
 * @class UIElement
 */
export class UIElement extends EventMachine {
  constructor(opt, props = {}) {
    super(opt, props);

    this.created();

    this.initialize();

    this.initializeStoreEvent();

  }

  /**
   * UIElement instance 에 필요한 기본 속성 설정
   */
  initializeProperty (opt, props = {}) {

    this.opt = opt || {};
    this.parent = this.opt;
    this.props = props;
    this.source = uuid();
    this.sourceName = this.constructor.name;

    if (opt && opt.$store) this.$store = opt.$store;
    if (opt && opt.$app) this.$app = opt.$app;
  }

  created() {}

  getRealEventName(e, s = MULTI_PREFIX) {
    var startIndex = e.indexOf(s);
    return e.substr(startIndex < 0 ? 0 : startIndex + s.length);
  }

  /**
   * initialize store event
   *
   * you can define '@xxx' method(event) in UIElement
   *
   *
   */
  initializeStoreEvent() {

    this.filterProps(REG_STORE_MULTI_PATTERN).forEach(key => {
      const events = this.getRealEventName(key, MULTI_PREFIX);

      // support deboounce for store event
      var [methods, params] = splitMethodByKeyword(events.split(SPLITTER), 'debounce');

      var debounceSecond = 0
      if (methods.length) {
        debounceSecond = +params[0].target || 0
      }

      events
        .split(SPLITTER)
        .filter(it => {
          return methods.indexOf(it) === -1
        })
        .map(it => it.trim())
        .forEach(e => {
          var callback = this[key].bind(this);
          callback.displayName = `${this.sourceName}.${e}`;
          callback.source = this.source;
          this.$store.on(e, callback, this, debounceSecond);
      });
    });
  }

  destoryStoreEvent() {
    this.$store.offAll(this);
  }

  destroy () {
    super.destroy()

    this.destoryStoreEvent();
  }

  rerender() {
    super.rerender();

    this.initialize();

    this.initializeStoreEvent();
  }


  emit($1, $2, $3, $4, $5) {
    this.$store.source = this.source;
    this.$store.sourceContext = this;
    this.$store.emit($1, $2, $3, $4, $5);
  }

  trigger($1, $2, $3, $4, $5) {
    this.$store.source = this.source;
    this.$store.trigger($1, $2, $3, $4, $5);
  }

  on (message, callback) {
    this.$store.on(message, callback);
  }

  off (message, callback) {
    this.$store.off(message, callback);
  }
}
