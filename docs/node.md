Node
===============
- `id: number`:
    A unique identifier for this node in the graph
- `title: string`:
    The display name for this node

- `data: Map<string, string>`:
    An immutable Map you can use to store arbitrary metadata about this node

- `x: number`:
    The x position of this node in the viewport
- `y: number`:
    The y position of this node in the viewport
- `width: number`:
    The measured width of this node element
- `height: number`:
    The measured height of this node element

- <code>inputs: List<[Pin](/pin)></code>:
    The list of all the input pins of this node
- <code>outputs: List<[Pin](/pin)></code>:
    The list of all the output pins of this node
