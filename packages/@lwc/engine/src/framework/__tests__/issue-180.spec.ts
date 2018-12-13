import { createElement, LightningElement } from '../main';

describe('issue #180', () => {

    it('should support data-foo attribute', () => {
        class MyComponent extends LightningElement {
            connectedCallback() {
                expect(this.getAttribute('data-foo')).toBe("miami");
            }
        }
        const elm = createElement('x-foo', { is: MyComponent });
        elm.setAttribute('data-foo', 'miami');
        document.body.appendChild(elm);
        expect(elm.getAttribute('data-foo')).toBe('miami');
    });

});