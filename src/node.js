// @flow
import React, {
    Component,
} from 'react';
import Measure from 'react-measure';

import type {
    Node as NodeData,
    Pin as PinData,
} from './state';
import Pin from './pin';
import styles from './node.css';

function NOOP() {}

type NodeProps = {
    node: NodeData,
    nodeClass: ReactClass<any>,
    pinClass: ReactClass<any>,

    measureNode: (id: number, width: number, height: number) => void,
    measurePin: (id: number, y: number, height: number) => void,
    moveNode: (id: number, x: number, y: number, final: ?boolean) => void,
    mouseDown: (id: number, evt: SyntheticMouseEvent) => void,
    dragPin: (node: NodeData, pin: PinData, evt: SyntheticMouseEvent) => void,
    dropPin: (node: NodeData, pin: PinData, evt: SyntheticMouseEvent) => void,

    selected: boolean
};

export default class Node extends Component {
    constructor(props: NodeProps) {
        super(props);

        this.mouseDown = (evt: SyntheticMouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();

            this.__nodeStartX = this.props.node.x;
            this.__nodeStartY = this.props.node.y;
            this.__mouseStartX = evt.clientX;
            this.__mouseStartY = evt.clientY;

            window.addEventListener('mousemove', this.mouseMove);
            window.addEventListener('mouseup', this.mouseUp);

            this.props.mouseDown(this.props.node.id, evt);
        };

        this.mouseMove = (evt: SyntheticMouseEvent) => {
            evt.preventDefault();

            this.props.moveNode(
                this.props.node.id,
                this.__nodeStartX + (evt.clientX - this.__mouseStartX),
                this.__nodeStartY + (evt.clientY - this.__mouseStartY),
            );
        };

        this.mouseUp = (evt: SyntheticMouseEvent) => {
            evt.preventDefault();

            this.props.moveNode(
                this.props.node.id,
                this.__nodeStartX + (evt.clientX - this.__mouseStartX),
                this.__nodeStartY + (evt.clientY - this.__mouseStartY),
                true,
            );

            window.removeEventListener('mousemove', this.mouseMove);
            window.removeEventListener('mouseup', this.mouseUp);
        };

        this.measureNode = (rect: {width: number, height: number}) => {
            this.props.measureNode(
                this.props.node.id,
                rect.width, rect.height,
            );
        };

        this.measurePin = (y: number, height: number) => {
            this.props.measurePin(
                this.props.node.id,
                y, height,
            );
        };

        this.dragPin = (pin: PinData, evt: SyntheticMouseEvent) => {
            this.props.dragPin(this.props.node, pin, evt);
        };

        this.dropPin = (pin: PinData, evt: SyntheticMouseEvent) => {
            this.props.dropPin(this.props.node, pin, evt);
        };
    }

    shouldComponentUpdate(nextProps: NodeProps) {
        return this.props.node !== nextProps.node ||
            this.props.dropPin !== nextProps.dropPin ||
            this.props.selected !== nextProps.selected;
    }

    componentWillUnmount() {
        window.removeEventListener('mousemove', this.mouseMove);
        window.removeEventListener('mouseup', this.mouseUp);
    }

    props: NodeProps;

    mouseDown: (evt: SyntheticMouseEvent) => void;
    mouseMove: (evt: SyntheticMouseEvent) => void;
    mouseUp: (evt: SyntheticMouseEvent) => void;
    measureNode: (rect: {width: number, height: number}) => void;
    measurePin: (y: number, height: number) => void;
    dragPin: (pin: PinData, evt: SyntheticMouseEvent) => void;
    dropPin: (pin: PinData, evt: SyntheticMouseEvent) => void;

    __nodeStartX: number;
    __nodeStartY: number;
    __mouseStartX: number;
    __mouseStartY: number;

    render() {
        const NodeClass = this.props.nodeClass;

        return (
            <Measure whiteList={['width', 'height']} onMeasure={this.measureNode}>
                <div className={styles.node} onMouseDown={this.mouseDown} style={{
                    transform: `translate(${this.props.node.x}px, ${this.props.node.y}px)`,
                }}>
                    <NodeClass
                        node={this.props.node}
                        selected={this.props.selected}
                        inputs={this.props.node.inputs.map(pin => (
                            <Pin key={pin.name} pin={pin}
                                pinClass={this.props.pinClass}
                                onDrag={NOOP} onDrop={this.dropPin}
                                shouldMeasure={this.props.node.height > 0}
                                onMeasure={this.measurePin} />
                        ))}
                        outputs={this.props.node.outputs.map(pin => (
                            <Pin key={pin.name} pin={pin}
                                pinClass={this.props.pinClass}
                                onDrop={NOOP} onDrag={this.dragPin}
                                shouldMeasure={this.props.node.height > 0}
                                onMeasure={this.measurePin} />
                        ))} />
                </div>
            </Measure>
        );
    }
}
