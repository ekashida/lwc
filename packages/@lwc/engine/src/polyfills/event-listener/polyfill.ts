import {
    windowRemoveEventListener as nativeWindowRemoveEventListener,
    windowAddEventListener as nativeWindowAddEventListener,
} from '../../env/window';
import {
    removeEventListener as nativeRemoveEventListener,
    addEventListener as nativeAddEventListener,
} from '../../env/element';
import { eventTargetGetter } from '../../env/dom';
import { DOCUMENT_POSITION_CONTAINED_BY, compareDocumentPosition } from '../../env/node';
import { getNodeOwnerKey } from '../../faux-shadow/node';
import { patchEvent } from '../../faux-shadow/events';

const guid = `__lwcEventWrapper${Date.now()}__`;

function doesEventNeedsPatch(e: Event): boolean {
    const originalTarget = eventTargetGetter.call(e);
    if (originalTarget instanceof Node) {
        if ((compareDocumentPosition.call(document, originalTarget) & DOCUMENT_POSITION_CONTAINED_BY) !== 0 && getNodeOwnerKey(originalTarget)) {
            return true;
        }
    }
    return false;
}

function getEventListenerWrapper(fnOrObj): EventListener | null {
    let wrapperFn: EventListener | null = null;
    try {
        wrapperFn = fnOrObj[guid];
        if (!wrapperFn) {
            wrapperFn = fnOrObj[guid] = function(this: EventTarget, e: Event) {
                // we don't want to patch every event, only when the original target is coming
                // from inside a synthetic shadow
                if (doesEventNeedsPatch(e)) {
                    patchEvent(e);
                }
                return fnOrObj.call(this, e);
            };
        }
    } catch (e) { /** ignore */ }
    return wrapperFn;
}

function windowAddEventListener(this: EventTarget, type, fnOrObj, optionsOrCapture) {
    const handlerType = typeof fnOrObj;
    // bail if `fnOrObj` is not a function, not an object
    if (handlerType !== 'function' && handlerType !== 'object') {
        return;
    }
    // bail if `fnOrObj` is an object without a `handleEvent` method
    if (handlerType === 'object' && (!fnOrObj.handleEvent || typeof fnOrObj.handleEvent !== 'function')) {
        return;
    }
    const wrapperFn = getEventListenerWrapper(fnOrObj);
    nativeWindowAddEventListener.call(this, type, wrapperFn, optionsOrCapture);
}

function windowRemoveEventListener(this: EventTarget, type, fnOrObj, optionsOrCapture) {
    const wrapperFn = getEventListenerWrapper(fnOrObj);
    nativeWindowRemoveEventListener.call(this, type, wrapperFn || fnOrObj, optionsOrCapture);
}

function addEventListener(this: EventTarget, type, fnOrObj, optionsOrCapture) {
    const handlerType = typeof fnOrObj;
    // bail if `fnOrObj` is not a function, not an object
    if (handlerType !== 'function' && handlerType !== 'object') {
        return;
    }
    // bail if `fnOrObj` is an object without a `handleEvent` method
    if (handlerType === 'object' && (!fnOrObj.handleEvent || typeof fnOrObj.handleEvent !== 'function')) {
        return;
    }
    const wrapperFn = getEventListenerWrapper(fnOrObj);
    nativeAddEventListener.call(this, type, wrapperFn, optionsOrCapture);
}

function removeEventListener(this: EventTarget, type, fnOrObj, optionsOrCapture) {
    const wrapperFn = getEventListenerWrapper(fnOrObj);
    nativeRemoveEventListener.call(this, type, wrapperFn || fnOrObj, optionsOrCapture);
}

addEventListener.__lwcOriginal__ = nativeAddEventListener;
removeEventListener.__lwcOriginal__ = nativeRemoveEventListener;
windowAddEventListener.__lwcOriginal__ = nativeWindowAddEventListener;
windowRemoveEventListener.__lwcOriginal__ = nativeWindowRemoveEventListener;

function windowPatchListeners() {
    window.addEventListener = windowAddEventListener;
    window.removeEventListener = windowRemoveEventListener;
}

function nodePatchListeners() {
    Node.prototype.addEventListener = addEventListener;
    Node.prototype.removeEventListener = removeEventListener;
}

export default function apply() {
    windowPatchListeners();
    nodePatchListeners();
}