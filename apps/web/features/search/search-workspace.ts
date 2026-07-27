import type { Tables } from "@lushra/database";

import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ProjectSearchResult = Tables<"projects">;
export type ArtifactSearchResult = Tables<"artifacts"> & { projectName: string };
export type SourceSearchResult = Tables<"sources"> & { projectName: string };

export type WorkspaceSearchResults = {
  projects: ProjectSearchResult[];
  artifacts: ArtifactSearchResult[];
  sources: SourceSearchResult[];
};

export type SearchWorkspaceResult =
  | { status: "ready"; results: WorkspaceSearchResults }
  | { status: "error" };

const RESULT_LIMIT = 20;
const MAX_QUERY_LENGTH = 200;

function toIlikePattern(query: string): string {
  return `%${query.slice(0, MAX_QUERY_LENGTH)}%`;
}

/**
 * Merges same-entity rows found via separate per-column `ilike` queries
 * (title match, content match, ...) into one deduplicated, most-recently-
 * updated-first list. Separate `ilike` calls are used instead of a single
 * `.or(...)` filter because `.or()` builds a raw, comma-delimited filter
 * string -- interpolating user search text into it would let a comma or
 * parenthesis in the query smuggle in an unintended extra filter clause.
 */
function mergeUniqueById<T extends { id: string; updated_at: string }>(...groups: T[][]): T[] {
  const byId = new Map<string, T>();

  for (const group of groups) {
    for (const row of group) {
      byId.set(row.id, row);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, RESULT_LIMIT);
}

type ColumnSearchResult<T> = { rows: T[] } | { error: true };

async function attachProjectNames<T extends { project_id: string }>(
  supabase: SupabaseServerClient,
  rows: T[]
): Promise<(T & { projectName: string })[] | null> {
  if (rows.length === 0) {
    return [];
  }

  const projectIds = Array.from(new Set(rows.map((row) => row.project_id)));

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name")
    .in("id", projectIds);

  if (error || !projects) {
    if (error) {
      console.error("searchWorkspace (project lookup) failed:", error.message);
    }

    return null;
  }

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));

  return rows.map((row) => ({
    ...row,
    projectName: projectNameById.get(row.project_id) ?? "Unknown project"
  }));
}

async function searchProjects(
  supabase: SupabaseServerClient,
  workspaceId: string,
  pattern: string
): Promise<ColumnSearchResult<ProjectSearchResult>> {
  const [byName, byDescription] = await Promise.all([
    supabase.from("projects").select("*").eq("workspace_id", workspaceId).ilike("name", pattern),
    supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .ilike("description", pattern)
  ]);

  const error = byName.error ?? byDescription.error;

  if (error) {
    console.error("searchWorkspace (projects) failed:", error.message);
    return { error: true };
  }

  return { rows: mergeUniqueById(byName.data ?? [], byDescription.data ?? []) };
}

async function searchArtifacts(
  supabase: SupabaseServerClient,
  workspaceId: string,
  pattern: string
): Promise<ColumnSearchResult<Tables<"artifacts">>> {
  const [byTitle, byContent] = await Promise.all([
    supabase.from("artifacts").select("*").eq("workspace_id", workspaceId).ilike("title", pattern),
    supabase
      .from("artifacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .ilike("content", pattern)
  ]);

  const error = byTitle.error ?? byContent.error;

  if (error) {
    console.error("searchWorkspace (artifacts) failed:", error.message);
    return { error: true };
  }

  return { rows: mergeUniqueById(byTitle.data ?? [], byContent.data ?? []) };
}

async function searchSources(
  supabase: SupabaseServerClient,
  workspaceId: string,
  pattern: string
): Promise<ColumnSearchResult<Tables<"sources">>> {
  const [byTitle, byUrl, byContent] = await Promise.all([
    supabase.from("sources").select("*").eq("workspace_id", workspaceId).ilike("title", pattern),
    supabase.from("sources").select("*").eq("workspace_id", workspaceId).ilike("url", pattern),
    supabase.from("sources").select("*").eq("workspace_id", workspaceId).ilike("content", pattern)
  ]);

  const error = byTitle.error ?? byUrl.error ?? byContent.error;

  if (error) {
    console.error("searchWorkspace (sources) failed:", error.message);
    return { error: true };
  }

  return { rows: mergeUniqueById(byTitle.data ?? [], byUrl.data ?? [], byContent.data ?? []) };
}

/**
 * Global, workspace-scoped keyword search across the entities that already
 * carry a name/title and descriptive text -- Projects, Artifacts, Sources
 * (Experience Architecture §30, Platform Architecture §16). Every query is
 * scoped by `workspace_id` and goes through the ordinary RLS-enforced
 * server client, the same `is_workspace_member` boundary every other read
 * in this app relies on -- search is a read over existing entities, not a
 * separate data store with its own copy of project truth.
 */
export async function searchWorkspace(
  workspaceId: string,
  query: string
): Promise<SearchWorkspaceResult> {
  const trimmed = query.trim();

  if (!trimmed) {
    return { status: "ready", results: { projects: [], artifacts: [], sources: [] } };
  }

  const pattern = toIlikePattern(trimmed);
  const supabase = await createClient();

  const [projectsResult, artifactsResult, sourcesResult] = await Promise.all([
    searchProjects(supabase, workspaceId, pattern),
    searchArtifacts(supabase, workspaceId, pattern),
    searchSources(supabase, workspaceId, pattern)
  ]);

  if ("error" in projectsResult || "error" in artifactsResult || "error" in sourcesResult) {
    return { status: "error" };
  }

  const [artifacts, sources] = await Promise.all([
    attachProjectNames(supabase, artifactsResult.rows),
    attachProjectNames(supabase, sourcesResult.rows)
  ]);

  if (!artifacts || !sources) {
    return { status: "error" };
  }

  return {
    status: "ready",
    results: { projects: projectsResult.rows, artifacts, sources }
  };
}
