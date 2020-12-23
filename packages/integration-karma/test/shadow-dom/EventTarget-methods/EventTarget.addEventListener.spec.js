import { createElement } from 'lwc';
import { extractDataIds } from 'test-utils';

import Container from 'x/container';

function createShadowTree(parentNode) {
    const elm = createElement('x-container', { is: Container });
    elm.setAttribute('data-id', 'x-container');
    parentNode.appendChild(elm);
    return extractDataIds(elm);
}

describe('EventTarget.addEventListener', () => {
    let nodes;
    beforeEach(() => {
        nodes = createShadowTree(document.body);
    });

    it('should accept a function listener as second parameter for all nodes', () => {
        const targets = [
            nodes.button,
            nodes['container_div'],
            nodes['x-container'].shadowRoot,
            nodes['x-container'],
            document.body,
            document.documentElement,
            document,
            window,
        ];

        const log = [];
        targets.forEach((node) => {
            node.addEventListener(
                'click',
                function () {
                    log.push(this);
                }.bind(node)
            );
        });

        nodes.button.click();

        expect(log).toEqual(targets);
    });

    it('should accept a listener config as second parameter for all nodes except shadow root and host', () => {
        const targets = [
            nodes.button,
            nodes['container_div'],
            document.body,
            document.documentElement,
            document,
            window,
        ];

        const log = [];
        targets.forEach((node) => {
            node.addEventListener('click', {
                handleEvent: function () {
                    log.push(this);
                }.bind(node),
            });
        });

        nodes.button.click();

        expect(log).toEqual(targets);
    });

    if (!process.env.NATIVE_SHADOW) {
        it('should throw error when a listener config is passed for shadow root and host', () => {
            [nodes['x-container'], nodes['x-container'].shadowRoot].forEach((node) => {
                expect(() => {
                    node.addEventListener('click', {
                        handleEvent: () => {},
                    });
                }).toThrowMatching((e) => e.message.startsWith('Invalid second argument'));
            });
        });
    }
});
