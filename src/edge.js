// @flow
import React, {
    Component,
} from 'react';

import type {
    Node as NodeData,
    Edge as EdgeData,
} from './state';

type EdgeProps = {
    edge: EdgeData,
    origin: NodeData,
    dest: NodeData,
};

export default class Edge extends Component {
    shouldComponentUpdate(nextProps: EdgeProps) {
        return this.props.edge !== nextProps.edge ||
            this.props.origin !== nextProps.origin ||
            this.props.dest !== nextProps.dest;
    }

    props: EdgeProps;

    render() {
        const { output, input, color } = this.props.edge;
        const from = this.props.origin;
        const to = this.props.dest;

        if (from.minPin === Infinity || to.minPin === Infinity) {
            return null;
        }

        const start = {
            x: from.x + from.width,
            y: from.y + from.minPin + ((output + 0.5) * from.pinHeight),
        };
        const end = {
            x: to.x,
            y: to.y + to.minPin + ((input + 0.5) * to.pinHeight),
        };
        const delta = {
            x: end.x - start.x,
            y: end.y - start.y,
        };

        const goingForward = delta.x >= 0.0;
        const tension = {
            x: Math.min(Math.abs(delta.x), goingForward ? 1000 : 200),
            y: Math.min(Math.abs(delta.y), goingForward ? 1000 : 200),
        };

        const tangent = goingForward ? {
            x: (tension.x + tension.y) * 0.5,
            y: 0,
        } : {
            x: (tension.x * 1.5) + (tension.y * 0.75),
            y: 0,
        };

        return (
            <path
                fill="none"
                stroke={color}
                d={`
                    M${start.x} ${start.y}
                    C${start.x + tangent.x} ${start.y + tangent.y},
                     ${end.x - tangent.x} ${end.y - tangent.y},
                     ${end.x} ${end.y}
                 `} />
        );
    }
}
