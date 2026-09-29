/**
 * Patch fetch on Window.prototype (and any parent prototype in the chain) as well as the window object itself.
 * Guarantees both a getter and setter exist for window.fetch.
 * Prevents "Uncaught TypeError: Cannot set property fetch of #<Window> which has only a getter"
 * when third-party scripts (e.g., Google GSI, dev tools, or polyfills) attempt to wrap or reassign fetch.
 * Also automatically sanitizes non-ISO-8859-1 code points from headers to prevent fatal TypeError crashes.
 */
(function patchFetchProperty() {
  if (typeof window === 'undefined') return;

  try {
    const rawFetch = window.fetch;
    if (typeof rawFetch !== 'function') return;

    // Helper to sanitize strings to ISO-8859-1 (code points <= 255)
    function sanitizeString(str: any): string {
      if (typeof str !== 'string') return String(str);
      let needsSanitization = false;
      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 255) {
          needsSanitization = true;
          break;
        }
      }
      if (!needsSanitization) return str;

      let res = '';
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code <= 255) {
          res += str[i];
        }
      }
      return res;
    }

    // Helper to sanitize headers argument of RequestInit
    function sanitizeHeaders(headers: any): any {
      if (!headers) return headers;

      // Plain object
      if (typeof headers === 'object' && !(headers instanceof Headers) && !Array.isArray(headers)) {
        const cleaned: Record<string, string> = {};
        for (const key of Object.keys(headers)) {
          const cleanKey = sanitizeString(key);
          const cleanVal = sanitizeString(headers[key]);
          if (cleanKey) {
            cleaned[cleanKey] = cleanVal;
          }
        }
        return cleaned;
      }

      // Headers instance
      if (headers instanceof Headers) {
        try {
          const cleaned = new Headers();
          headers.forEach((value, key) => {
            const cleanKey = sanitizeString(key);
            const cleanVal = sanitizeString(value);
            if (cleanKey) {
              cleaned.append(cleanKey, cleanVal);
            }
          });
          return cleaned;
        } catch (e) {
          console.warn('Failed to sanitize Headers object:', e);
          return headers;
        }
      }

      // Array of string pairs
      if (Array.isArray(headers)) {
        return headers
          .map((pair) => {
            if (Array.isArray(pair) && pair.length >= 2) {
              const cleanKey = sanitizeString(String(pair[0]));
              const cleanVal = sanitizeString(String(pair[1]));
              return [cleanKey, cleanVal];
            }
            return pair;
          })
          .filter((pair) => Array.isArray(pair) && pair.length >= 2 && pair[0]);
      }

      return headers;
    }

    // Patch Headers class constructors and prototype methods to avoid crashes on creation
    if (typeof window.Headers !== 'undefined') {
      const RawHeaders = window.Headers;
      const CustomHeaders = function(this: any, init?: any) {
        let cleanedInit = init;
        if (init) {
          try {
            cleanedInit = sanitizeHeaders(init);
          } catch (err) {
            console.warn('Headers constructor sanitization warning:', err);
          }
        }
        return Reflect.construct(RawHeaders, [cleanedInit]);
      } as any;

      CustomHeaders.prototype = RawHeaders.prototype;

      try {
        Object.defineProperty(window, 'Headers', {
          value: CustomHeaders,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        window.Headers = CustomHeaders;
      }

      const proto = RawHeaders.prototype;
      const rawAppend = proto.append;
      const rawSet = proto.set;

      proto.append = function(this: any, name: string, value: string) {
        return rawAppend.call(this, sanitizeString(name), sanitizeString(value));
      };

      proto.set = function(this: any, name: string, value: string) {
        return rawSet.call(this, sanitizeString(name), sanitizeString(value));
      };
    }

    // Wrap a given fetch function with header-sanitizing logic
    function makeSanitizingFetch(fn: typeof fetch) {
      return function (this: any, input: RequestInfo | URL, init?: RequestInit) {
        let cleanedInit = init;
        if (init && init.headers) {
          try {
            cleanedInit = {
              ...init,
              headers: sanitizeHeaders(init.headers),
            };
          } catch (err) {
            console.warn('Fetch headers sanitization warning:', err);
          }
        }
        return fn.call(this || window, input, cleanedInit);
      };
    }

    let activeFetch = makeSanitizingFetch(rawFetch);

    const getter = function () {
      return activeFetch;
    };

    const setter = function (fn: any) {
      if (typeof fn === 'function') {
        activeFetch = makeSanitizingFetch(fn);
      }
    };

    // 1. Walk prototype chain of window to find where 'fetch' property descriptor resides
    let currentObj: any = window;
    while (currentObj) {
      const desc = Object.getOwnPropertyDescriptor(currentObj, 'fetch');
      if (desc) {
        if (!desc.set) {
          try {
            Object.defineProperty(currentObj, 'fetch', {
              get: getter,
              set: setter,
              configurable: true,
              enumerable: true,
            });
          } catch {
            // Ignore if prototype descriptor cannot be modified
          }
        }
        break;
      }
      currentObj = Object.getPrototypeOf(currentObj);
    }

    // 2. Define an own accessor descriptor on window instance
    try {
      const winDesc = Object.getOwnPropertyDescriptor(window, 'fetch');
      if (!winDesc || !winDesc.set) {
        Object.defineProperty(window, 'fetch', {
          get: getter,
          set: setter,
          configurable: true,
          enumerable: true,
        });
      }
    } catch {
      // Ignore if window instance property cannot be redefined
    }
  } catch (err) {
    console.warn('patchFetchProperty warning:', err);
  }
})();

export {};
