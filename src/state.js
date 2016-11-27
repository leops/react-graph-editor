// @flow
import {
    Iterable, fromJS,
    List, Stack,
    Map, Record,
} from 'immutable';


type PinRecordType = {
    name: string,
    connected: boolean,
    data: Map<string, string>,
};

const defaultPin: PinRecordType = {
    name: '',
    connected: false,
    data: new Map(),
};

export const Pin = Record(defaultPin);


type NodeRecordType = {
    id: number,
    title: string,
    data: Map<string, string>,

    x: number,
    y: number,
    width: number,
    height: number,

    minPin: number,
    pinHeight: number,

    inputs: List<Pin>,
    outputs: List<Pin>,
};

const defaultNode: NodeRecordType = {
    id: 0,
    title: '',
    data: new Map(),

    x: 0,
    y: 0,
    width: 0,
    height: 0,

    minPin: (1 / 0),
    pinHeight: 0,

    inputs: new List(),
    outputs: new List(),
};

export const Node = Record(defaultNode);


type EdgeRecordType = {
    from: number,
    output: number,
    to: number,
    input: number,
    color: string,
};

const defaultEdge: EdgeRecordType = {
    from: 0,
    output: 0,
    to: 0,
    input: 0,
    color: '#fff',
};

export const Edge = Record(defaultEdge);


type EditorStateRecordType = {
    nodes: Map<number, Node>,
    edges: List<Edge>,
    selection: List<number>,
};

const defaultEditorState: EditorStateRecordType = {
    nodes: new Map(),
    edges: new List(),
    selection: new List(),
};

const EditorState = Record(defaultEditorState);


type MouseStateRecordType = {
    down: boolean,
    x: number,
    y: number,
    startX: number,
    startY: number,

    node: ?Node,
    pin: ?Pin,
};

const defaultMouseState: MouseStateRecordType = {
    down: false,
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,

    node: null,
    pin: null,
};

type Rect = {
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
};

class MouseState extends Record(defaultMouseState) {
    get draggingEdge(): boolean {
        return this.node !== null && this.pin !== null;
    }

    get rect(): Rect {
        return {
            minX: Math.min(this.startX, this.x),
            minY: Math.min(this.startY, this.y),
            maxX: Math.max(this.startX, this.x),
            maxY: Math.max(this.startY, this.y),
        };
    }
}


type MenuStateRecordType = {
    open: boolean,
    x: number,
    y: number,
};

const defaultMenuState: MenuStateRecordType = {
    open: false,
    x: 0,
    y: 0,
};

export const MenuState = Record(defaultMenuState);


type ClipboardRecordType = {
    nodes: Map<number, Node>,
    edges: List<Edge>,
};

const defaultClipboard: ClipboardRecordType = {
    nodes: new Map(),
    edges: new List(),
};

export const Clipboard = Record(defaultClipboard);


type GraphStateRecordType = {
    editorState: EditorState,

    undoStack: Stack<EditorState>,
    redoStack: Stack<EditorState>,

    mouseState: MouseState,
    menuState: MenuState,
    clipboard: Clipboard,
};

const defaultGraphState: GraphStateRecordType = {
    editorState: new EditorState(),

    undoStack: new Stack(),
    redoStack: new Stack(),

    mouseState: new MouseState(),
    menuState: new MenuState(),
    clipboard: new Clipboard(),
};

export default class GraphState extends Record(defaultGraphState) {
    static createEmpty(): GraphState {
        return new GraphState();
    }

    static fromGraph(nodes: Map<number, Node>, edges: List<Edge>): GraphState {
        return new GraphState({
            editorState: new EditorState({
                nodes, edges,
            }),
        });
    }

    static restore(data: Object): GraphState {
        return new GraphState({
            editorState: fromJS(data, (key, value) => {
                switch (key) {
                    case '':
                        return new EditorState(value.toObject());

                    case 'selection':
                        return value.toList();

                    case 'nodes':
                        return value.toMap()
                            .mapEntries(([k, v]) => ([
                                Number(k),
                                new Node(v.toObject()),
                            ]));

                    case 'edges':
                        return value.toList()
                            .map(edge => new Edge(edge.toObject()));

                    case 'inputs':
                    case 'outputs':
                        return value.toList()
                            .map(pin => new Pin(pin));

                    case 'data':
                        return value.toMap();

                    default: {
                        const isIndexed = Iterable.isIndexed(value);
                        return isIndexed ? value.toList() : value.toMap();
                    }
                }
            }),
        });
    }

    save(): Object {
        return this.editorState.toJS();
    }

    addNode(node: Object): GraphState {
        const { x, y } = this.menuState;

        return this.__pushState(
            this.editorState.update(
                'nodes',
                nodes => {
                    const data = new Node({ // TODO: Deep convert
                        ...node,
                        id: nodes.size,
                        x,
                        y,
                    });

                    return nodes.set(data.id, data);
                },
            ),
        );
    }

    _measureNode(id: number, width: number, height: number): GraphState {
        return this.updateIn(
            ['editorState', 'nodes', id],
            node => node
                .set('width', width)
                .set('height', height),
        );
    }

    _measurePin(id: number, y: number, height: number): GraphState {
        return this.updateIn(
            ['editorState', 'nodes', id],
            node => node
                .update('minPin', v => Math.min(v, y - node.y))
                .set('pinHeight', height),
        );
    }

    moveNode(id: number, x: number, y: number, pushUndo: ?boolean = false): GraphState {
        const nextState = this.isSelected(id) ? (
            this.editorState.update(
                'nodes',
                nodes => {
                    const node = nodes.get(id);
                    const deltaX = x - node.x;
                    const deltaY = y - node.y;

                    return nodes
                        .map(n => {
                            if (this.isSelected(n.id)) {
                                return n
                                    .set('x', n.x + deltaX)
                                    .set('y', n.y + deltaY);
                            }

                            return n;
                        });
                },
            )
        ) : (
            this.editorState
                .set('selection', new List([id]))
                .updateIn(
                    ['nodes', id],
                    node => node
                        .set('x', x)
                        .set('y', y),
                )
        );

        if (pushUndo) {
            return this.__pushState(nextState);
        }

        return this.set('editorState', nextState);
    }

    mapNodes(fn: (node: Node) => Node): GraphState {
        return this.updateIn(
            ['editorState', 'nodes'],
            nodes => nodes.map(fn),
        );
    }

    _startConnection(node: Node, pin: Pin): GraphState {
        return this.update(
            'mouseState',
            mouse => mouse
                .set('node', node.id)
                .set('pin', node.outputs.findKey(({ name }) => name === pin.name)),
        );
    }

    _endConnection(node: Node, pin: Pin): GraphState {
        const from = this.mouseState.node;
        const output = this.mouseState.pin;

        const to = node.id;
        const input = node.inputs.findKey(({ name }) => name === pin.name);

        return this._endMouse()
            .addLink(from, output, to, input);
    }

    addLink(from: number, output: number, to: number, input: number): GraphState {
        return this.__pushState(
            this.editorState
                .update('nodes', nodes =>
                    nodes
                        .updateIn(
                            [from, 'outputs', output],
                            pin => pin.set('connected', true),
                        )
                        .updateIn(
                            [to, 'inputs', input],
                            pin => pin.set('connected', true),
                        ),
                )
                .update('edges', edges =>
                    edges
                        .filter(edge => edge.to !== to || edge.input !== input)
                        .push(new Edge({
                            id: edges.size,
                            from,
                            to,
                            output,
                            input,
                        })),
                ),
        );
    }

    openMenu(x: number, y: number): GraphState {
        return this.update(
            'menuState',
            menu => menu
                .set('open', true)
                .set('x', x)
                .set('y', y),
        );
    }

    closeMenu(): GraphState {
        return this.setIn(
            ['menuState', 'open'],
            false,
        );
    }

    selectNode(id: number, pushNode: boolean = false): GraphState {
        return this.__pushState(
            this.editorState.update(
                'selection',
                selection => {
                    if (pushNode) {
                        return selection.push(id);
                    }

                    return new List([id]);
                },
            ),
        );
    }

    get selectedNodes(): List<Node> {
        return this.editorState.selection.map(id => this.editorState.nodes.get(id));
    }

    isSelected(node: number): boolean {
        return this.editorState.selection.find(id => id === node) !== undefined;
    }

    selectAll(): GraphState {
        return this.__pushState(
            this.editorState.set(
                'selection',
                this.editorState.nodes.keySeq().toList(),
            ),
        );
    }

    clearSelection(): GraphState {
        return this.editorState.selection.isEmpty() ? this : this.__pushState(
            this.editorState.update(
                'selection',
                list => list.clear(),
            ),
        );
    }

    deleteSelection(): GraphState {
        return this.__pushState(
            this.editorState.update(
                'nodes',
                nodes => nodes.filter(node => !this.isSelected(node.id)),
            ).update(
                'edges',
                edges => edges.filter(edge => this.editorState.selection.find(
                    id => id === edge.from || id === edge.to,
                ) === undefined),
            ).update(
                'selection',
                list => list.clear(),
            ),
        );
    }

    cut(): GraphState {
        const nodes = this.editorState.nodes.reduce(({ clip, editor }, node, key) => {
            if (this.isSelected(node.id)) {
                return {
                    clip: clip.set(key, node),
                    editor,
                };
            }

            return {
                clip,
                editor: editor.set(key, node),
            };
        }, {
            clip: new Map(),
            editor: new Map(),
        });

        const edges = this.editorState.nodes.reduce(({ clip, editor }, edge) => {
            const isSelected = this.editorState.selection.find(
                id => id === edge.from || id === edge.to,
            ) !== undefined;

            if (isSelected) {
                return {
                    clip: clip.push(edge),
                    editor,
                };
            }

            return {
                clip,
                editor: editor.push(edge),
            };
        }, {
            clip: new List(),
            editor: new List(),
        });

        return this.__pushState(
            this.editorState.set(
                'nodes', nodes.editor,
            ).set(
                'edges', edges.editor,
            ).update(
                'selection',
                list => list.clear(),
            ),
        ).update(
            'clipboard',
            clip => clip.set(
                'nodes', nodes.clip,
            ).set(
                'edges', edges.clip,
            ),
        );
    }

    copy(): GraphState {
        return this.update(
            'clipboard',
            cb => cb.set(
                'nodes',
                this.editorState.nodes.filter(node =>
                    this.isSelected(node.id),
                ),
            ).set(
                'edges',
                this.editorState.edges.filter(edge =>
                    this.isSelected(edge.from) && this.isSelected(edge.to),
                ),
            ),
        );
    }

    paste(): GraphState {
        const remapped = this.clipboard.nodes.reduce(({ nodes, mapping }, node) => {
            let id = node.id;
            while (nodes.has(id)) {
                id++;
            }

            return {
                nodes: nodes.set(id, node.set('id', id)),
                mapping: mapping.set(node.id, id),
            };
        }, {
            nodes: this.editorState.nodes,
            mapping: new Map(),
        });

        return this.__pushState(
            this.editorState
                .set('nodes', remapped.nodes)
                .update('edges', edges =>
                    this.clipboard.edges.reduce((list, edge) =>
                        list.push(
                            edge.set(
                                'from',
                                remapped.mapping.get(edge.from, edge.from),
                            ).set(
                                'to',
                                remapped.mapping.get(edge.to, edge.to),
                            ),
                        )
                    , edges),
                ),
        );
    }

    _startMouse(x: number, y: number): GraphState {
        return this.update(
            'mouseState',
            mouse => mouse
                .set('down', true)
                .set('startX', x)
                .set('startY', y),
        )._updateMouse(x, y);
    }

    _updateMouse(x: number, y: number): GraphState {
        const nextState = this.update(
            'mouseState',
            mouse => mouse.set('x', x).set('y', y),
        );

        const {
            node, pin,
        } = nextState.mouseState;

        if (node == null && pin == null) {
            const {
                minX, minY,
                maxX, maxY,
            } = nextState.mouseState.rect;

            return nextState.setIn(
                ['editorState', 'selection'],
                nextState.editorState.nodes
                    .filter(n =>
                        n.x >= minX &&
                        (n.x + n.width) <= maxX &&
                        n.y >= minY &&
                        (n.y + n.height) <= maxY,
                    )
                    .map(({ id }) => id),
            );
        }

        return nextState;
    }

    _endMouse(): GraphState {
        let nextState = this;
        if (!this.mouseState.draggingEdge) {
            nextState = this.__pushState(this.editorState);
        }

        return nextState.update(
            'mouseState',
            mouse => mouse
                .set('down', false)
                .set('node', null)
                .set('pin', null),
        );
    }

    __pushState(nextState: EditorState): GraphState {
        return this.update(
            'undoStack',
            stack => stack.push(this.editorState),
        ).set(
            'editorState',
            nextState,
        );
    }

    undo(): GraphState {
        if (this.undoStack.isEmpty()) {
            return this;
        }

        const prevState = this.undoStack.peek();
        const currState = this.editorState;

        return this
            .set('editorState', prevState)
            .update('undoStack', stack => stack.pop())
            .update('redoStack', stack => stack.push(currState));
    }

    redo(): GraphState {
        if (this.redoStack.isEmpty()) {
            return this;
        }

        const currState = this.editorState;
        const nextState = this.redoStack.peek();

        return this
            .set('editorState', nextState)
            .update('undoStack', stack => stack.push(currState))
            .update('redoStack', stack => stack.pop());
    }
}
