React Graph Editor
===============

Heavily based on [Draft.js](https://github.com/facebook/draft-js), React Graph Editor
is a framework for building graph-based editors like the [Rasen
Editor](https://github.com/leops/rasen-editor) or [Focus](https://github.com/leops/focus).

# Example
```js
import React from 'react';
import ReactDOM from 'react-dom';
import {
    Graph,
    GraphState,
} from 'react-graph-editor';

class Editor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {graph: GraphState.createEmpty()};
        this.onChange = graph => this.setState({graph});
    }

    render() {
        const {graph} = this.state;
        return <Graph value={graph} onChange={this.onChange} />;
    }
}

ReactDOM.render(
    <Editor />,
    document.getElementById('container')
);
```

# Docs
See the [docs](https://github.com/leops/react-graph-editor/tree/master/docs) folder.
