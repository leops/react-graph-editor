Graph
=============

`Graph` is the core component for the React Graph Editor module. It's properties
are listed in the <code>[GraphProps](/graph#graphprops)</code> type.

## GraphProps
- <code>value: [GraphState](/graphstate)</code>:
    The current state of the editor
- <code>onChange: (nextState: [GraphState](/graphstate)) => void</code>:
    A function called when user interacts with the editor, where `nextState` is
    the new state of the editor after said interaction

- `className: string`:
    A CSS class applied to the root element of the graph

- <code>nodeClass: ReactClass&lt;[NodeProps](/graph#nodeprops)&gt;</code>:
    The component class to be used for rendering the nodes
- <code>pinClass: ReactClass&lt;[PinProps](/graph#pinprops)&gt;</code>:
    The component class to be used for rendering the pins
- <code>menuClass: ?ReactClass&lt;[MenuProps](/graph#menuprops)&gt;</code>:
    If defined, the component class to be used for rendering the menu

## NodeProps
- <code>node: [Node](/node)</code>:
    The metadata of the node rendered by this component
- `selected: boolean`:
    Whether this node is currently selected

- `inputs: List<Element>`:
    A list of elements used to render the input pins of the node
- `outputs: List<Element>`:
    A list of elements used to render the output pins of the node

Note that the elements in the `inputs` and `outputs` arrays are not instances of
your `pinClass`, but some internal react-graph-editor components instead.

## PinProps
- <code>pin: [Pin](/pin)</code>:
    The metadata of the node pin rendered by this component

## MenuProps
- <code>menu: [MenuState](/menustate)</code>:
    The state of this menu
