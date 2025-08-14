# Simple Todo Tool

A simplified, robust todo list manager for Kode that avoids common validation errors.

## Why SimpleTodoTool?

The SimpleTodoTool was created as a more reliable alternative to the TodoWriteTool, with:
- Simpler validation requirements
- Action-based interface (add, update, list, clear)
- Better error handling
- No strict priority requirements
- More flexible input handling

## Features

- **Add todos**: Create new tasks with automatic ID generation
- **Update todos**: Modify existing tasks or add new ones
- **List todos**: View all current todos with status indicators
- **Clear todos**: Remove all todos at once
- **Status tracking**: pending (○), in_progress (→), completed (✓)

## Usage Examples

### Adding a new todo
```javascript
SimpleTodo({
  action: "add",
  content: "Write documentation"
})
```

### Updating todo status
```javascript
SimpleTodo({
  action: "update",
  todos: [
    {id: "todo_123", status: "in_progress"}
  ]
})
```

### Listing all todos
```javascript
SimpleTodo({
  action: "list"
})
```

### Clearing all todos
```javascript
SimpleTodo({
  action: "clear"
})
```

## Advantages over TodoWriteTool

1. **Flexible Input**: Doesn't require all fields to be present
2. **Action-Based**: Clear intent with explicit actions
3. **Better Error Recovery**: Handles undefined/missing data gracefully
4. **Simpler Schema**: Fewer required fields mean fewer validation errors
5. **Default Values**: Automatically adds sensible defaults

## Implementation Details

- Uses the same `todoStorage` utility as TodoWriteTool
- Compatible with existing todo persistence
- Supports agent-scoped todos
- Provides clear visual feedback with status symbols

## Status Indicators

- ○ = Pending (not started)
- → = In Progress (currently working)
- ✓ = Completed (finished)

## Best Practices

1. Use descriptive content for todos
2. Keep only one task in_progress at a time  
3. Regularly mark completed tasks
4. Use the list action to review current state
5. Clear old completed tasks periodically