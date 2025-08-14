export const simpleTodoPrompt = `
# Simple Todo Tool

A reliable and easy-to-use todo list manager.

## Usage Examples

### Adding a new task
\`\`\`json
{
  "action": "add",
  "content": "Review pull request #123"
}
\`\`\`

### Updating multiple todos
\`\`\`json
{
  "action": "update",
  "todos": [
    {"id": "todo_1234", "content": "Updated task description", "status": "in_progress"},
    {"id": "todo_5678", "status": "completed"}
  ]
}
\`\`\`

### Listing all todos
\`\`\`json
{
  "action": "list"
}
\`\`\`

### Clearing all todos
\`\`\`json
{
  "action": "clear"
}
\`\`\`

## Features
- Simple action-based interface
- No complex validation requirements
- Automatic ID generation for new todos
- Flexible update operations
- Clear status indicators

## Status Types
- **pending**: Not started (○)
- **in_progress**: Currently working (→)
- **completed**: Finished (✓)

## Best Practices
1. Use descriptive content for todos
2. Keep only one task in_progress at a time
3. Mark tasks as completed when done
4. Use list action to review current state
5. Clear completed tasks periodically
`