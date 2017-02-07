(function(window, undefined) {
	'use strict';
	var isPrototypeOf,
		defineGetter,
		defineProperty,
		defineSetter,
		document,
		getOwnPropertyDescriptor,
		hasDescriptors,
		hasGettersAndSetters,
		thisHasOwnProperty,
		IC,
		slice;

	document = window.document;

	IC = window.IC;
	if (!IC) {
		IC = window.IC = {};
	}

	isPrototypeOf = Object.prototype.isPrototypeOf;
	defineGetter = Object.prototype.__defineGetter__;
	defineSetter = Object.prototype.__defineSetter__;
	defineProperty = Object.defineProperty;
	getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	thisHasOwnProperty = Object.prototype.hasOwnProperty;

	slice = Array.prototype.slice;

	hasDescriptors = (function() {
		var object;
		object = {};
		try {
			defineProperty(object, object, object);
			return 'value' in getOwnPropertyDescriptor(object, object);
		} catch (e) {
			return false;
		}
	}());

	hasGettersAndSetters = defineGetter && defineSetter;

	(function() {
		var getPropertyName, iface, ifaceWithDefault, impl;
		getPropertyName = function(methodName) {
			return '_IC__' + methodName;
		};
		if (hasDescriptors) {
			iface = function(methodName) {
				IC[methodName] = function(_this) {
					var method;
					method = _this[getPropertyName(methodName)];
					if (!method) {
						throw new TypeError("Object " + _this + " has no method '" + methodName + "'");
					}
					return method.apply(_this, slice.call(arguments, 1));
				};
			};
			ifaceWithDefault = function(methodName, method) {
				IC[methodName] = function(_this) {
					var propertyName;
					propertyName = getPropertyName(methodName);
					return (propertyName in Object(_this)?
						_this[propertyName] :
						method).apply(_this, slice.call(arguments, 1));
				};
			};
			impl = function(methodName, object, method) {
				var propertyName;
				propertyName = getPropertyName(methodName);
				if (!(propertyName in object)) {
					Object.defineProperty(object, propertyName, {
						configurable: false,
						enumerable: false,
						value: method,
						writable: false
					});
				}
			};
		} else {
			(function() {
				var methods, Method, Impl;
				methods = {};
				Method = function() {
					this.impls = [];
				};
				Method.prototype.get = function(object) {
					var impls, i, length, impl, candidate;
					impls = this.impls;
					for (i = 0, length = impls.length; i < length; i += 1) {
						impl = impls[i];
						if (isPrototypeOf.call(impl.object, object)) {
							candidate = impl;
							while (++i < length) {
								impl = impls[i];
								if (candidate.isParentOf(impl) &&
									isPrototypeOf.call(impl.object, object)) {
									candidate = impl;
								}
							}
							return candidate.method;
						}
					}
					return undefined;
				};
				Method.prototype.put = function(object, method) {
					var impls, i, length, impl;
					impls = this.impls;
					for (i = 0, length = impls.length; i < length; i += 1) {
						impl = impls[i];
						if (impl.object === object) {
							return;
						}
					}
					this.impls.push(new Impl(object, method));
				};
				Impl = function(object, method) {
					this.object = object;
					this.method = method;
				};
				Impl.prototype.isParentOf = function(rhs) {
					return this.object.isPrototypeOf(rhs.object);
				};
				iface = function(methodName) {
					IC[methodName] = function(_this) {
						var method, impl;
						method = methods[getPropertyName(methodName)];
						if (!method) {
							throw new TypeError("Object doesn't support property or method '" + methodName + "'");
						}
						impl = method.get(Object(_this));
						if (!impl) {
							throw new TypeError("Object doesn't support property or method '" + methodName + "'");
						}
						return impl.apply(_this, slice.call(arguments, 1));
					};
				};
				ifaceWithDefault = function(methodName, defaultImpl) {
					IC[methodName] = function(_this) {
						var propertyName, method, impl;
						propertyName = getPropertyName(methodName);
						method = methods[propertyName];
						if (!method) {
							impl = defaultImpl;
						} else {
							impl = method.get(Object(_this));
							if (!impl) {
								impl = defaultImpl;
							}
						}
						return impl.apply(_this, slice.call(arguments, 1));
					};
				};
				impl = function(methodName, object, impl) {
					var propertyName, method;
					propertyName = getPropertyName(methodName);
					method = methods[propertyName];
					if (!method) {
						method = new Method();
						methods[propertyName] = method;
					}
					method.put(object, impl);
				};
			}());
		}
		IC.iface = function() {
			switch (arguments.length) {
			case 1:
				return iface.apply(this, arguments);
			case 2:
				return ifaceWithDefault.apply(this, arguments);
			default:
				throw new TypeError();
			}
		};
		IC.impl = impl;
	}());

	IC.iface('hasOwnProperty', function(propertyName) {
		return thisHasOwnProperty.call(this, propertyName);
	});

	IC.iface('forWithKey_', function(f) {
		var key;
		for (key in this) {
			if (IC.has(this, key)) {
				f.call(this, key, this[key]);
			}
		}
	});
	IC.impl('forWithKey_', Array.prototype, function(f) {
		var i, length;
		for (i = 0, length = this.length; i < length; i += 1) {
			f.call(this, i, this[i]);
		}
	});
	IC.impl('forWithKey_', String.prototype, function(f) {
		var i, length;
		for (i = 0, length = this.length; i < length; i += 1) {
			f.call(this, i, this.charAt(i));
		}
	});

	IC.iface('for_', function(f) {
		var key;
		for (key in this) {
			if (IC.has(this, key)) {
				f.call(this, this[key]);
			}
		}
	});
	IC.impl('for_', Array.prototype, function(f) {
		for (var i = 0, length = this.length; i < length; i += 1) {
			f.call(this, this[i]);
		}
	});
	IC.impl('for_', String.prototype, function(f) {
		var i, length;
		for (i = 0, length = this.length; i < length; i += 1) {
			f.call(this, this.charAt(i));
		}
	});

	IC.iface('any', function() {
		for (var key in this) {
			if (IC.has(this, key)) {
				if (f.call(this, this[key])) {
					return true;
				}
			}
		}
		return false;
	});
	IC.impl('any', Array.prototype, function() {
		for (var i = 0, length = this.length; i < length; i += 1) {
			if (f.call(this, this[i])) {
				return true;
			}
		}
		return false;
	});

	IC.asArray = (function() {
		var ArrayLike;
		ArrayLike = function(delegate) {
			this.__delegate = delegate;
		};
		IC.impl('forWithKey_', ArrayLike.prototype, function(f) {
			var delegate, i, length;
			delegate = this.__delegate;
			for (i = 0, length = delegate.length; i < length; i += 1) {
				f.call(this, i, delegate[i]);
			}
		});
		IC.impl('for_', ArrayLike.prototype, function(f) {
			var delegate, i, length;
			delegate = this.__delegate;
			for (i = 0, length = delegate.length; i < length; i += 1) {
				f.call(this, delegate[i]);
			}
		});
		IC.impl('any', ArrayLike.prototype, function(f) {
			var delegate = this.__delegate;
			for (var i = 0, length = delegate.length; i < length; i += 1) {
				if (f.call(this, delegate[i])) {
					return true;
				}
			}
			return false;
		})
		return function(delegate) {
			return new ArrayLike(delegate);
		};
	}());

	IC.noop = function() {};

	IC.ignoreErrorIn = function(f) {
		try {
			f();
		} catch (ignore) {}
	};

	IC.ready = function(window, f) {
		var document, isReady, ready, domContentLoaded, load, onReadyStateChange, onLoad;
		document = window.document;
		isReady = false;
		ready = function() {
			if (!isReady) {
				if (!document.body) {
					window.setTimeout(ready, 1);
					return;
				}
				f();
				isReady = true;
			}
		};
		domContentLoaded = function() {
			document.removeEventListener('DOMContentLoaded', domContentLoaded, false);
			ready();
		};
		load = function() {
			window.removeEventListener('load', load, false);
			ready();
		};
		onReadyStateChange = function() {
			if (document.readyState === 'complete') {
				document.detachEvent('onreadystatechange', onReadyStateChange);
				ready();
			}
		};
		onLoad = function() {
			window.detachEvent('onload', onLoad);
			ready();
		};
		if (document.readyState === 'complete') {
			ready();
			return;
		}
		if (document.addEventListener) {
			document.addEventListener('DOMContentLoaded', domContentLoaded, false);
			window.addEventListener('load', load, false);
		} else if (document.attachEvent) {
			document.attachEvent('onreadystatechange', onReadyStateChange);
			document.attachEvent('onload', onLoad);
			(function() {
				var documentElement, doScrollCheck, topLevel;
				documentElement = document.documentElement || document.body;
				doScrollCheck = function() {
					if (isReady) {
						return;
					}
					try {
						documentElement.doScroll('left');
					} catch (e) {
						window.setTimeout(doScrollCheck, 1);
						return;
					}
					ready();
				};
				topLevel = false;
				IC.ignoreErrorIn(function() {
					topLevel = window.frameElement === undefined || window.frameElement === null;
				});
				if (topLevel && documentElement.doScroll) {
					doScrollCheck();
				}
			}());
		}
	};

	IC.iface('equals');
	IC.impl('equals', Array.prototype, function(array) {
		var length, i;
		if (this === array) {
			return true;
		}
		if (array === undefined || array === null) {
			return false;
		}
		length = this.length;
		if (array.length !== length) {
			return false;
		}
		for (i = 0; i < length; i += 1) {
			if (this[i] !== array[i]) {
				return false;
			}
		}
		return true;
	});
	IC.impl('equals', String.prototype, function(object) {
		return object && this.toString() === object.toString();
	});

	IC.iface('contains', function(value) {
		return IC.has(this, value);
	});
	IC.impl('contains', String.prototype, function(value) {
		return this.indexOf(value) !== -1;
	});

	IC.iface('isEmpty', function() {
		var propertyName;
		for (propertyName in this) {
			if (IC.has(this, propertyName)) {
				return false;
			}
		}
		return true;
	});
	IC.impl('isEmpty', Array.prototype, function() {
		return this.length === 0;
	});
	IC.impl('isEmpty', String.prototype, function() {
		return this.length === 0;
	});

	IC.iface('trim');
	IC.impl('trim', String.prototype, (function() {
		var trimLeft, trimRight;
		trimLeft = /^\s+/;
		trimRight = /\s+$/;
		return function() {
			return this.toString().replace(trimLeft, '').replace(trimRight, '');
		};
	}()));

	IC.iface('startsWith');
	IC.impl('startsWith', String.prototype, function(prefix) {
		return this.indexOf(prefix) === 0;
	});

	IC.iface('endsWith');
	IC.impl('endsWith', String.prototype, function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	});

	IC.iface('protocol');
	IC.impl('protocol', String.prototype, function() {
		var a, protocol;
		a = document.createElement('a');
		a.href = this;
		protocol = a.protocol;
		return protocol === ':'? document.location.protocol : protocol; // IE8 bug
	});

	IC.iface('hostname');
	IC.impl('hostname', String.prototype, function() {
		var a;
		a = document.createElement('a');
		a.href = this;
		return a.hostname;
	});

	IC.iface('search');
	IC.impl('search', String.prototype, function() {
		var a;
		a = document.createElement('a');
		a.href = this;
		return a.search;
	});

	IC.iface('parameters');
	IC.impl('parameters', String.prototype, (function() {
		var decode, searchParser;
		decode = (function() {
			var plusParser;
			plusParser = /\+/g;
			return function(str) {
				return window.decodeURIComponent(str.replace(plusParser, ' '));
			};
		}());
		searchParser = /(?:^\?|[&;])([^&;=]+)(?:=([^&;#]*))?/g;
		return function() {
			var search, parameters, result, name, value;
			search = IC.search(this);
			parameters = {};
			while ((result = searchParser.exec(search))) {
				name = decode(result[1]);
				value = result[2];
				if (value) {
					value = result[2];
				} else {
					value = '';
				}
				parameters[name] = value;
			}
			return parameters;
		};
	}()));

	IC.iface('concatEncodedParameter');
	IC.impl('concatEncodedParameter', String.prototype, function(name, value) {
		var entry;
		entry = name + '=' + value;
		if (IC.startsWith(this, '?')) {
			if (IC.endsWith(this, '&')) {
				return this + entry;
			}
			return this + '&' + entry;
		}
		return this + '?' + entry;
	});

	IC.cookies = function() {
		var cookie, cookies;
		cookie = document.cookie;
		cookies = {};
		IC.for_(cookie.split(';'), function(cookie) {
			var array;
			array = IC.trim(cookie).split('=');
			cookies[array[0]] = array[1];
		});
		return cookies;
	};

	IC.scriptParameters = function() {
		var scripts, src;
		scripts = document.getElementsByTagName('script');
		src = scripts[scripts.length - 1].getAttribute('src');
		return IC.parameters(src);
	};

	IC.Element = (function() {
		var AttributeChangeEvent, MutationObserver, addAttributeListener;
		AttributeChangeEvent = function(element, name, value) {
			this.element = element;
			this.name = name;
			this.value = value;
		};
		MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
		if (MutationObserver) {
			addAttributeListener = function(element, name, listener) {
				var observer;
				observer = new MutationObserver(function(records) {
					IC.for_(records, function(record) {
						var target, attributeName;
						target = record.target;
						attributeName = record.attributeName;
						listener(new AttributeChangeEvent(target, attributeName, target.getAttribute(attributeName)));
					});
				});
				observer.observe(element, {
					attributes: true,
					attributeFilter: [name]
				});
			};
		} else if (document.addEventListener) {
			addAttributeListener = function(element, name, listener) {
				element.addEventListener('DOMAttrModified', function(event) {
					if (name === event.attrName) {
						listener(new AttributeChangeEvent(event.target, name, event.newValue));
					}
				});
			};
		} else if (document.attachEvent) {
			addAttributeListener = function(element, name, listener) {
				element.attachEvent('onpropertychange', function(event) {
					var srcElement;
					if (event.propertyName === name) {
						srcElement = event.srcElement;
						listener(new AttributeChangeEvent(srcElement, name, srcElement[name]));
					}
				});
			};
		}
		return {
			addAttributeListener: addAttributeListener
		};
	}());

	IC.BindableObject = (function() {
		var PropertyChangeEvent, addPropertyChangeListener, create;
		PropertyChangeEvent = function(name, value) {
			this.name = name;
			this.value = value;
		};
		if (hasDescriptors) {
			addPropertyChangeListener = function(object, name, listener) {
				var value;
				value = object[name];
				defineProperty(object, name, {
					configurable: true,
					enumerable: true,
					get: function() {
						return value;
					},
					set: function(newValue) {
						value = newValue;
						listener(new PropertyChangeEvent(name, newValue));
					}
				});
			};
			create = function() {
				return {};
			};
		} else if (hasGettersAndSetters) {
			addPropertyChangeListener = function(object, name, listener) {
				var value;
				value = object[name];
				defineGetter.call(object, name, function() {
					return value;
				});
				defineSetter.call(object, name, function(newValue) {
					value = newValue;
					listener(new PropertyChangeEvent(name, newValue));
				});
			};
			create = function() {
				return {};
			};
		} else if (document.attachEvent) {
			addPropertyChangeListener = function(object, name, listener) {
				object.attachEvent('onpropertychange', function(event) {
					if (event.propertyName === name) {
						listener(new PropertyChangeEvent(name, event.srcElement[name]));
					}
				});
			};
			create = function() {
				var frameWindow, frameDocument, object;
				for (frameWindow = window, frameDocument = frameWindow.document;
				     frameWindow !== frameWindow.parent;
				     frameWindow = frameWindow.parent, frameDocument = frameWindow.document) {
					if (frameDocument.createElement && frameDocument.body) {
						break;
					}
				}
				object = frameDocument.createElement('ic:object'); // IE does not handle document.createElementNS correctly
				frameDocument.body.appendChild(object);
				return object;
			};
		} else {
			throw new Error();
		}
		return {
			create: create,
			addPropertyChangeListener: addPropertyChangeListener
		};
	}());

	IC.CSRF = (function() {
		var SECURITY_KEY_PARAMETER_NAME,
			SECURITY_KEY_HEADER_NAME,
			SECURITY_KEY_COOKIE_NAME,
			isValidProtocol,
			isValidDomain,
			isValidURL,
			isValidAction,
			appendKeyToForm,
			appendKeyToForms,
			appendKeyToAnchors,
			enhanceWindow,
			enhanceFrames,
			enhanceXMLHttpRequest,
			wrapURL,
			wrapLocation,
			wrapHasLocation,
			wrapHasSrc,
			wrapHasAction;

		SECURITY_KEY_PARAMETER_NAME = 'securityKey';

		SECURITY_KEY_HEADER_NAME = 'com.infinitecampus.security.csrf.Key';

		SECURITY_KEY_COOKIE_NAME = SECURITY_KEY_HEADER_NAME;

		isValidProtocol = function(protocol) {
			return IC.equals(protocol, 'http:') || IC.equals(protocol, 'https:');
		};

		isValidDomain = (function() {
			var validDomain;
			validDomain = document.domain;
			return function(domain) {
				if (IC.isEmpty(domain)) {
					return true;
				}
				if (IC.equals(domain, validDomain)) {
					return true;
				}
				if (IC.equals(domain.charAt(0), '.')) {
					return IC.endsWith(validDomain, domain);
				}
				return IC.endsWith(validDomain, '.' + domain);
			};
		}());

		isValidURL = function(url) {
			return url? isValidProtocol(IC.protocol(url)) && isValidDomain(IC.hostname(url)) : false;
		};

		isValidAction = isValidURL;

		appendKeyToForm = (function() {
			var validTargets;
			validTargets = {
				'_blank': true,
				'_self': true
			};
			return function(document, form, key) {
				var action, input;
				action = form.getAttribute('action');
				if (isValidAction(action) ||
					(!action && validTargets[form.target])) {
					input = document.createElement('INPUT');
					input.type = 'hidden';
					input.name = SECURITY_KEY_PARAMETER_NAME;
					input.value = key;
					IC.ignoreErrorIn(function() { form.appendChild(input); });
				}
			};
		}());

		appendKeyToForms = function(document, key) {
			IC.for_(IC.asArray(document.getElementsByTagName('form')), function(form) {
				appendKeyToForm(document, form, key);
			});
		};

		appendKeyToAnchors = function(document, key) {
			IC.for_(IC.asArray(document.getElementsByTagName('a')), function(a) {
				var href, search;
				href = a.getAttribute('href', 2); // second parameter to workaround IE bug
				search = a.search;
				if (href && !IC.startsWith(href, '#') && !IC.startsWith(href, 'javascript:') &&
					isValidURL(href)) {
					a.search = IC.concatEncodedParameter(search, SECURITY_KEY_PARAMETER_NAME, key);
				}
			});
		};

		wrapURL = function(url, key) {
			var a, search, result, indexOf;
			if (!key) {
				key = IC.CSRF.key;
				if (!key) {
					return url;
				}
			}
			if (url && !IC.startsWith(url, '#') && !IC.startsWith(url, 'javascript:') &&
				isValidURL(url)) {
				a = window.document.createElement('a');
				a.href = url;
				search = a.search;
				a.search = IC.concatEncodedParameter(search, SECURITY_KEY_PARAMETER_NAME, key);
				result = a.getAttribute('href', 2);
				indexOf = result.indexOf(url);
				return indexOf === -1?
					result :
					result.substring(indexOf);
			}
			return url;
		};

		enhanceWindow = function(window, key) {
			var open, showModalDialog;
			open = window.open;
			window.open = function(url, name, specs, replace) {
				if (arguments.length >= 1) {
					url = wrapURL(url, key);
				}
				return open(url, name, specs, replace); // IE's window.open does not have a call or apply property
			};
			showModalDialog = window.showModalDialog;
			if (showModalDialog) {
				window.showModalDialog = function(url, dialogArguments, options) {
					if (arguments.length >= 1) {
						url = wrapURL(url, key);
					}
					return showModalDialog(url, dialogArguments, options);
				};
			}
		};

		enhanceFrames = function(window, key) {
			IC.for_(IC.asArray(window.frames), function(frame) {
				var enhancedSrc;
				IC.Element.addAttributeListener(frame.frameElement, 'src', function(event) {
					var src;
					src = event.value;
					if (src !== enhancedSrc) {
						enhancedSrc = wrapURL(src, key);
						event.element.setAttribute(event.name, enhancedSrc);
					}
				});
			});
		};

		enhanceXMLHttpRequest = function(window, key) {
			if (!('XMLHttpRequest' in window) && 'ActiveXObject' in window) {
				window.XMLHttpRequest = function() {
					return new window.ActiveXObject('Microsoft.XMLHTTP');
				};
			}
			if (window.XMLHttpRequest === undefined || window.XMLHttpRequest === null) {
				return;
			}
			if (typeof window.XMLHttpRequest !== 'function') {
				(function() {
					var Wrapped, Wrapper, sync, WrapperPrototype;
					Wrapped = window.XMLHttpRequest;
					Wrapper = function() {
						this._wrapped = new Wrapped();
						var _this = this;
						this._wrapped.onreadystatechange = function() {
							IC.ignoreErrorIn(function() { _this.readyState = _this._wrapped.readyState; });
							IC.ignoreErrorIn(function() { _this.responseText = _this._wrapped.responseText; });
							IC.ignoreErrorIn(function() { _this.responseXML = _this._wrapped.responseXML; });
							IC.ignoreErrorIn(function() { _this.status = _this._wrapped.status; });
							IC.ignoreErrorIn(function() { _this.statusText = _this._wrapped.statusText; });

							if (_this.onreadystatechange !== undefined) {
								_this.onreadystatechange.apply(this, arguments);
							}
						};
					};
					sync = function(_this) {
						IC.ignoreErrorIn(function() { _this._wrapped.responseType = _this.responseType; });
						IC.ignoreErrorIn(function() { _this._wrapped.timeout = _this.timeout; });
						IC.ignoreErrorIn(function() { _this._wrapped.upload = _this.upload; });
						IC.ignoreErrorIn(function() { _this._wrapped.withCredentials = _this.withCredentials; });
					};
					WrapperPrototype = Wrapper.prototype;
					WrapperPrototype.abort = function() {
						sync(this);
						return this._wrapped.abort();
					};
					WrapperPrototype.getAllResponseHeaders = function() {
						sync(this);
						return this._wrapped.getAllResponseHeaders();
					};
					WrapperPrototype.getResponseHeader = function(header) {
						sync(this);
						return this._wrapped.getResponseHeader(header);
					};
					WrapperPrototype.open = function(method, url, async, user, pass) {
						sync(this);
						return this._wrapped.open(method, url, async, user, pass);
					};
					WrapperPrototype.overrideMimeType = function(mimeType) {
						sync(this);
						return this._wrapped.overrideMimeType(mimeType);
					};
					WrapperPrototype.send = function(data) {
						sync(this);
						return this._wrapped.send(data);
					};
					WrapperPrototype.setRequestHeader = function(header, value) {
						sync(this);
						return this._wrapped.setRequestHeader(header, value);
					};
					Wrapper.UNSENT = 0;
					Wrapper.OPENED = 1;
					Wrapper.HEADERS_RECEIVED = 2;
					Wrapper.LOADING = 3;
					Wrapper.DONE = 4;
					window.XMLHttpRequest = Wrapper;
				}());
			}
			(function() {
				var XMLHttpRequestPrototype, open;
				XMLHttpRequestPrototype = window.XMLHttpRequest.prototype;
				open = XMLHttpRequestPrototype.open;
				XMLHttpRequestPrototype.open = function(method, url) {
					var result;
					result = open.apply(this, arguments);
					if (!this._securityKeyHeaderSet && isValidURL(url)) {
						this.setRequestHeader(SECURITY_KEY_HEADER_NAME, key);
						this._securityKeyHeaderSet = true;
					}
					return result;
				};
			}());
		};

		wrapLocation = function(location, key) {
			var wrappedLocation, listener;
			if (!key) {
				key = IC.CSRF.key;
				if (!key) {
					return location;
				}
			}
			wrappedLocation = IC.BindableObject.create();
			IC.ignoreErrorIn(function() {
				wrappedLocation.href = wrapURL(location.href, key);
			});
			IC.BindableObject.addPropertyChangeListener(wrappedLocation, 'href', function(event) {
				location[event.name] = wrapURL(event.value, key);
			});
			IC.ignoreErrorIn(function() {
				wrappedLocation.search = IC.concatEncodedParameter(location.search, SECURITY_KEY_PARAMETER_NAME, key);
			});
			IC.BindableObject.addPropertyChangeListener(wrappedLocation, 'search', function(event) {
				location[event.name] = IC.concatEncodedParameter(event.value, SECURITY_KEY_PARAMETER_NAME, key);
			});
			listener = function(event) {
				location[event.name] = event.value;
			};
			IC.for_(['hash', 'host', 'hostname', 'pathname', 'port', 'protocol'], function(name) {
				IC.ignoreErrorIn(function() {
					wrappedLocation[name] = location[name];
				});
				IC.BindableObject.addPropertyChangeListener(wrappedLocation, name, listener);
			});
			wrappedLocation.assign = function(url) {
				url = wrapURL(url, key);
				return location.assign(url);
			};
			wrappedLocation.reload = function() {
				return location.reload();
			};
			wrappedLocation.replace = function(url) {
				url = wrapURL(url, key);
				return location.replace(url);
			};
			wrappedLocation.toString = function() {
				return location.toString();
			};
			wrappedLocation.valueOf = function() {
				return location.valueOf();
			};
			return wrappedLocation;
		};

		wrapHasLocation = function(hasLocation, key) {
			var wrappedHasLocation, locationListener;
			if (!key) {
				key = IC.CSRF.key;
				if (!key) {
					return hasLocation;
				}
			}
			wrappedHasLocation = IC.BindableObject.create();
			locationListener = function(event) {
				var href;
				href = event.value;
				href = wrapURL(href, key);
				wrapLocation(hasLocation[event.name], key).href = href;
			};
			wrappedHasLocation.location = wrapLocation(hasLocation.location, key);
			IC.BindableObject.addPropertyChangeListener(wrappedHasLocation, 'location', locationListener);
			return wrappedHasLocation;
		};

		wrapHasSrc = function(hasSrc, key) {
			var wrappedHasSrc;
			if (!key) {
				key = IC.CSRF.key;
				if (!key) {
					return hasSrc;
				}
			}
			wrappedHasSrc = IC.BindableObject.create();
			wrappedHasSrc.src = hasSrc.src;
			IC.BindableObject.addPropertyChangeListener(wrappedHasSrc, 'src', function(event) {
				hasSrc.src = wrapURL(event.value, key);
			});
			return wrappedHasSrc;
		};

		wrapHasAction = function(hasAction, key) {
			var wrappedHasAction;
			if (!key) {
				key = IC.CSRF.key;
				if (!key) {
					return hasAction;
				}
			}
			wrappedHasAction = IC.BindableObject.create();
			wrappedHasAction.action = hasAction.action;
			IC.BindableObject.addPropertyChangeListener(wrappedHasAction, 'action', function(event) {
				hasAction.action = wrapURL(event.value, key);
			});
			return wrappedHasAction;
		};

		return {
			SECURITY_KEY_PARAMETER_NAME: SECURITY_KEY_PARAMETER_NAME,
			SECURITY_KEY_HEADER_NAME: SECURITY_KEY_HEADER_NAME,
			SECURITY_KEY_COOKIE_NAME: SECURITY_KEY_COOKIE_NAME,
			appendKeyToForm: appendKeyToForm,
			appendKeyToForms: appendKeyToForms,
			appendKeyToAnchors: appendKeyToAnchors,
			enhanceWindow: enhanceWindow,
			enhanceFrames: enhanceFrames,
			enhanceXMLHttpRequest: enhanceXMLHttpRequest,
			wrapURL: wrapURL,
			wrapLocation: wrapLocation,
			wrapHasLocation: wrapHasLocation,
			wrapHasSrc: wrapHasSrc,
			wrapHasAction: wrapHasAction
		};
	}());

	IC.wrapURL = IC.CSRF.wrapURL;
	IC.wrapLocation = IC.CSRF.wrapLocation;
	IC.wrapHasLocation = IC.CSRF.wrapHasLocation;
	IC.wrapHasSrc = IC.CSRF.wrapHasSrc;
	IC.wrapHasAction = IC.CSRF.wrapHasAction;

}(this));
