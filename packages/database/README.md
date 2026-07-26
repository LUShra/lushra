# @lushra/database

Supabase client configuration and generated database types for Lushra.

## Type generation

`src/generated/database.types.ts` is machine-generated from the live
Supabase schema via:

```
pnpm generate-types
```

It was generated against the `lushra` project (`fiilitjyencsgxrvpmzt`)
after the Milestone 6 migrations (`workspaces`, `workspace_memberships`,
`projects`, and the `create_workspace`/`is_workspace_member` functions)
were applied. `src/index.ts` re-exports the generated `Database` type.

The generated file is never hand-edited. Regenerate it (and commit the
result) after every migration that changes the schema.
