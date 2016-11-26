GraphState
=============

The `GraphState` holds the current "value" of the editor. This includes:
- The state of the graph (nodes and edges)
- The current selection
- The undo / redo stack

## Construction
- `static createEmpty(): GraphState`:
    Create a new, empty editor
- `static fromGraph(nodes: Map<number, Node>, edges: List<Edge>): GraphState`:
    Create an editor from an existing graph (advanced)
- `static restore(data: Object): GraphState`:
    Restore the editor from a previously serialized state

## Saving
- `save(): Object`:
    Returns a POD, serializable version of the editor

## Nodes
- `addNode(node: Object): GraphState`:
    Add a new node to the editor
- `moveNode(id: number, x: number, y: number, pushUndo: ?boolean = false): GraphState`:
    Update a node's position
- `mapNodes(fn: (node: Node) => Node): GraphState`:
    Runs a mapping function on all the nodes of the graph (advanced)

## Links
- `addLink(from: number, output: number, to: number, input: number): GraphState`:
    Add a new link between two nodes

## Menu
- `openMenu(x: number, y: number): GraphState`:
    Opens the menu
- `closeMenu(): GraphState`:
    Closes the menu

## Selection
- `selectNode(id: number, pushNode: boolean = false): GraphState`:
    Add a node to the current selection
- `get selectedNodes(): List<Node>`:
    Returns a list of the currently selected nodes
- `isSelected(node: Node): boolean`:
    Returns true is `node` is currently selected
- `clearSelection(): GraphState`:
    Clear the current selection

## Undo
- `undo(): GraphState`:
    Undo the last action, pushing it on the `redo` stack
- `redo(): GraphState`:
    Redo the last action, pushing it on the `undo` stack
