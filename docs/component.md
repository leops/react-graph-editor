Graph
=============

`Graph` is the core component for the React Graph Editor module.

## Props
- `value: GraphState`:
    The current state of the editor
- `onChange: (nextState: GraphState) => void`:
    A function called when user interacts with the editor, where `nextState` is
    the new state of the editor after said interaction

- `className: string`:
    A CSS class applied to the root element of the graph

- `nodeClass: ReactClass<any>`:
    The component class to be used for rendering the nodes
- `pinClass: ReactClass<any>`:
    The component class to be used for rendering the pins
- `menuClass: ?ReactClass<any>`:
    If defined, the component class to be used for rendering the menu
