// @flow
import React, {
    Component,
} from 'react';
import Measure from 'react-measure';

import type {
    Pin as PinData,
} from './state';

type PinProps = {
    pin: PinData,
    pinClass: ReactClass<any>,

    shouldMeasure: bool,
    onMeasure: (y: number, height: number) => void,

    onDrag: (pin: PinData, evt: SyntheticMouseEvent) => void,
    onDrop: (pin: PinData, evt: SyntheticMouseEvent) => void
};

export default class Pin extends Component {
    constructor(props: PinProps) {
        super(props);

        this.onMouseDown = (evt: SyntheticMouseEvent) => {
            this.props.onDrag(this.props.pin, evt);
        };

        this.onMouseUp = (evt: SyntheticMouseEvent) => {
            this.props.onDrop(this.props.pin, evt);
        };

        this.measure = (rect: {top: number, height: number}) => {
            this.props.onMeasure(rect.top, rect.height);
        };
    }

    shouldComponentUpdate(nextProps: PinProps) {
        return this.props.pin !== nextProps.pin ||
            this.props.shouldMeasure !== nextProps.shouldMeasure ||
            this.props.onDrop !== nextProps.onDrop;
    }

    onMouseDown: (evt: SyntheticMouseEvent) => void;
    onMouseUp: (evt: SyntheticMouseEvent) => void;
    measure: (rect: {top: number, height: number}) => void;

    props: PinProps;

    render() {
        const PinClass = this.props.pinClass;

        return (
            <Measure whiteList={['top', 'height']} shouldMeasure={this.props.shouldMeasure} onMeasure={this.measure}>
                <div style={{
                    display: 'inline-block',
                }} onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp}>
                    <PinClass pin={this.props.pin} />
                </div>
            </Measure>
        );
    }
}
