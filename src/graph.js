// @flow
import React, {
    Component,
} from 'react';
import {
    List,
} from 'immutable';

import Node from './node';
import Edge from './edge';

import {
    Node as NodeData,
} from './state';

// eslint-disable-next-line no-duplicate-imports
import type GraphState, {
    Pin as PinData,
} from './state';

import {
    graph,
} from './graph.css';

declare class SVGElement extends HTMLElement {
    getBBox: () => {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

type Props = {
    className: string,

    value: GraphState,
    onChange: (nextState: GraphState) => void,

    nodeClass: ReactClass<any>,
    pinClass: ReactClass<any>,
    menuClass: ?ReactClass<any>
};

type BatchedAction = {
    method: string,
    args: Array<any>
}

function NOOP() {}

const raf = (
    window ? (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame
    ) : null
) || (cb => setTimeout(cb, 16));

export default class Graph extends Component {
    constructor(props: Props) {
        super(props);

        this.__actionQueue = new List();

        this.mouseDown = (evt: SyntheticMouseEvent) => {
            evt.preventDefault();

            if (this.__graph) {
                let nextState = this.props.value;
                if (evt.target === this.__graph) {
                    nextState = nextState.closeMenu();
                }

                const { x, y } = this.getGraphCoords(evt);
                this.props.onChange(
                    nextState._startMouse(x, y),
                );
            }
        };

        this.mouseMove = (evt: SyntheticMouseEvent) => {
            if (this.__graph && this.props.value.mouseState.down) {
                evt.preventDefault();
                evt.stopPropagation();

                const { x, y } = this.getGraphCoords(evt);
                this.props.onChange(
                    this.props.value._updateMouse(x, y),
                );
            }
        };

        this.mouseUp = (evt: SyntheticMouseEvent) => {
            if (this.props.value.mouseState.down) {
                evt.preventDefault();
                evt.stopPropagation();

                let nextState = this.props.value._endMouse();
                if (this.props.value.mouseState.draggingEdge) {
                    const { x, y } = this.getGraphCoords(evt);
                    nextState = nextState.openMenu(x, y);
                }

                this.props.onChange(nextState);
            }
        };

        this.contextMenu = (evt: SyntheticMouseEvent) => {
            evt.preventDefault();

            const { x, y } = this.getGraphCoords(evt);
            this.props.onChange(
                this.props.value.openMenu(x, y),
            );
        };

        this.updateSVG = (svg: SVGElement) => {
            if (svg) {
                const bbox = svg.getBBox();
                svg.setAttribute('width', `${bbox.x + bbox.width}px`);
                svg.setAttribute('height', `${bbox.y + bbox.height}px`);

                this.__svg = svg;
            }
        };

        this.measureNode = (id: number, width: number, height: number) => {
            this.batchAction({
                method: '_measureNode',
                args: [id, width, height],
            });
        };

        this.measurePin = (id: number, y: number, height: number) => {
            this.batchAction({
                method: '_measurePin',
                args: [id, y, height],
            });
        };

        this.clickNode = (id: number, evt: SyntheticMouseEvent) => {
            if (!this.isSelected(id)) {
                this.props.onChange(
                    this.props.value.selectNode(id, evt.ctrlKey),
                );
            }
        };

        this.moveNode = (id: number, x: number, y: number, final: ?boolean = false) => {
            this.props.onChange(
                this.props.value.moveNode(id, x, y, final),
            );
        };

        this.dragPin = (node: NodeData, pin: PinData, evt: SyntheticMouseEvent) => {
            if (this.__graph) {
                evt.preventDefault();
                evt.stopPropagation();

                const { x, y } = this.getGraphCoords(evt);
                this.props.onChange(
                    this.props.value
                        ._startMouse(x, y)
                        ._startConnection(node, pin),
                );
            }
        };

        this.dropPin = (node: NodeData, pin: PinData, evt: SyntheticMouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();

            this.props.onChange(
                this.props.value._endConnection(node, pin),
            );
        };
    }

    componentDidUpdate() {
        this.updateSVG(this.__svg);
    }

    getGraphCoords(evt: SyntheticMouseEvent): {x: number, y: number} {
        return {
            x: evt.clientX + this.__graph.scrollLeft,
            y: evt.clientY + this.__graph.scrollTop,
        };
    }

    isSelected(node: NodeData) {
        return this.props.value.isSelected(node);
    }

    batchAction(action: BatchedAction) {
        if (this.__actionQueue.isEmpty()) {
            raf(() => {
                const currentQueue = this.__actionQueue;
                this.__actionQueue = this.__actionQueue.clear();

                this.props.onChange(
                    currentQueue.reduce((state, item) =>
                        state[item.method](...item.args)
                    , this.props.value),
                );
            });
        }

        this.__actionQueue = this.__actionQueue.push(action);
    }

    props: Props;

    __svg: SVGElement;
    __graph: HTMLDivElement;
    __actionQueue: List<BatchedAction>;

    mouseDown: (evt: SyntheticMouseEvent) => void;
    mouseMove: (evt: SyntheticMouseEvent) => void;
    mouseUp: (evt: SyntheticMouseEvent) => void;
    contextMenu: (evt: SyntheticMouseEvent) => void;
    updateSVG: (svg: SVGElement) => void;
    measureNode: (id: number, width: number, height: number) => void;
    measurePin: (id: number, y: number, height: number) => void;
    clickNode: (id: number, evt: SyntheticMouseEvent) => void;
    moveNode: (id: number, x: number, y: number, final: ?boolean) => void;
    dragPin: (node: NodeData, pin: PinData, evt: SyntheticMouseEvent) => void;
    dropPin: (node: NodeData, pin: PinData, evt: SyntheticMouseEvent) => void;

    render() {
        const {
            nodeClass, pinClass,
            menuClass: MenuClass,
            className,
        } = this.props;
        const {
            editorState,
            mouseState,
            menuState,
        } = this.props.value;
        const {
            nodes, edges,
        } = editorState;

        const dragLine = (() => {
            if (!mouseState.down) {
                return null;
            }

            if (mouseState.draggingEdge) {
                return (
                    <Edge origin={nodes.get(mouseState.node)} dest={new NodeData({
                        x: mouseState.x,
                        y: mouseState.y,
                        minPin: 0,
                    })} edge={{
                        output: mouseState.pin,
                        input: 0,
                        color: '#fff',
                    }} />
                );
            }

            const {
                minX, minY,
                maxX, maxY,
            } = mouseState.rect;

            return (
                <rect
                    x={minX} y={minY}
                    width={maxX - minX}
                    height={maxY - minY} />
            );
        });

        return (
            <div
                className={`${graph} ${className}`}
                onMouseDown={this.mouseDown}
                onMouseMove={this.mouseMove}
                onMouseUp={this.mouseUp}
                onContextMenu={this.contextMenu}
                ref={elem => {
                    this.__graph = elem;
                }}>

                <svg ref={this.updateSVG}>
                    {edges.map(edge => {
                        const from = nodes.get(edge.from);
                        const to = nodes.get(edge.to);

                        return from && to && (
                            <Edge
                                key={`${from.id}:${edge.output}-${to.id}:${edge.input}`}
                                origin={from} dest={to}
                                edge={edge} />
                        );
                    })}
                    {dragLine}
                </svg>

                {nodes.map(node => (
                    <Node key={node.id} node={node}
                        nodeClass={nodeClass}
                        pinClass={pinClass}
                        measureNode={this.measureNode}
                        measurePin={this.measurePin}
                        moveNode={this.moveNode}
                        mouseDown={this.clickNode}
                        dragPin={mouseState.draggingEdge ? NOOP : this.dragPin}
                        dropPin={mouseState.draggingEdge ? this.dropPin : NOOP}
                        selected={this.isSelected(node.id)} />
                )).toArray()}

                {MenuClass && menuState.open && <MenuClass menu={menuState} />}

            </div>
        );
    }
}
