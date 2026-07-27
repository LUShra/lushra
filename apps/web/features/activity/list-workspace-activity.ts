import type { Tables } from "@lushra/database";

import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ActivityItem = {
  id: string;
  timestamp: string;
  description: string;
  title: string;
  projectName: string | null;
  href: string;
};

export type ListWorkspaceActivityResult =
  | { status: "ready"; items: ActivityItem[] }
  | { status: "error" };

const PER_ENTITY_FETCH_LIMIT = 30;
const ACTIVITY_LIMIT = 30;

async function fetchProjectNames(
  supabase: SupabaseServerClient,
  workspaceId: string,
  projectIds: string[]
): Promise<Map<string, string> | null> {
  if (projectIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .in("id", projectIds);

  if (error || !data) {
    if (error) {
      console.error("listWorkspaceActivity (project lookup) failed:", error.message);
    }

    return null;
  }

  return new Map(data.map((project) => [project.id, project.name]));
}

type ProjectRow = Pick<
  Tables<"projects">,
  "id" | "name" | "status" | "archived_at" | "created_at" | "updated_at"
>;

/**
 * Every entity below derives its displayed timestamp/description from
 * columns that already exist -- there is no persisted event log, so
 * nothing here claims more history than `created_at`/`updated_at`/
 * `archived_at` genuinely support. Where a row could have changed for
 * more than one reason (e.g. an artifact edited vs. reviewed), the most
 * specific column available is used and the label stays honestly generic
 * ("updated") rather than guessing which specific edit happened.
 */
function projectItem(project: ProjectRow): ActivityItem {
  const href = `/workspace/projects/${project.id}`;

  if (project.status === "archived" && project.archived_at) {
    return {
      id: `project:${project.id}`,
      timestamp: project.archived_at,
      description: "Project archived",
      title: project.name,
      projectName: null,
      href
    };
  }

  const wasEdited = project.updated_at !== project.created_at;

  return {
    id: `project:${project.id}`,
    timestamp: wasEdited ? project.updated_at : project.created_at,
    description: wasEdited ? "Project updated" : "Project created",
    title: project.name,
    projectName: null,
    href
  };
}

type SessionRow = Pick<Tables<"sessions">, "id" | "project_id" | "created_at">;

function sessionItem(session: SessionRow, projectName: string): ActivityItem {
  return {
    id: `session:${session.id}`,
    timestamp: session.created_at,
    description: "Session started",
    title: "Session",
    projectName,
    href: `/workspace/projects/${session.project_id}/sessions/${session.id}`
  };
}

type ArtifactRow = Pick<
  Tables<"artifacts">,
  "id" | "project_id" | "title" | "status" | "created_at" | "updated_at"
>;

const ARTIFACT_STATUS_DESCRIPTIONS: Record<string, string> = {
  in_review: "Artifact submitted for review",
  approved: "Artifact approved",
  rejected: "Artifact rejected"
};

function artifactItem(artifact: ArtifactRow, projectName: string): ActivityItem {
  const href = `/workspace/projects/${artifact.project_id}/artifacts/${artifact.id}`;
  const statusDescription = ARTIFACT_STATUS_DESCRIPTIONS[artifact.status];

  if (statusDescription) {
    return {
      id: `artifact:${artifact.id}`,
      timestamp: artifact.updated_at,
      description: statusDescription,
      title: artifact.title,
      projectName,
      href
    };
  }

  const wasEdited = artifact.updated_at !== artifact.created_at;

  return {
    id: `artifact:${artifact.id}`,
    timestamp: wasEdited ? artifact.updated_at : artifact.created_at,
    description: wasEdited ? "Artifact updated" : "Artifact created",
    title: artifact.title,
    projectName,
    href
  };
}

type SourceRow = Pick<
  Tables<"sources">,
  "id" | "project_id" | "title" | "created_at" | "updated_at"
>;

function sourceItem(source: SourceRow, projectName: string): ActivityItem {
  const wasEdited = source.updated_at !== source.created_at;

  return {
    id: `source:${source.id}`,
    timestamp: wasEdited ? source.updated_at : source.created_at,
    description: wasEdited ? "Source updated" : "Source added",
    title: source.title,
    projectName,
    href: `/workspace/projects/${source.project_id}`
  };
}

/**
 * Experience Architecture §31: "what happened, where, when." This is
 * deliberately **not** the fuller Activity Event ledger (Product
 * Definition §20 item 12, §30) -- there is no new persisted entity, so
 * every item here is derived from a row that already exists, ordered by
 * the same column its own displayed timestamp is drawn from. A project,
 * artifact, or source that was deleted (sources support hard delete)
 * leaves no trace here, matching the honest absence of any tombstone/
 * history table -- this reflects current+recent state, not a permanent
 * audit log.
 */
export async function listWorkspaceActivity(
  workspaceId: string
): Promise<ListWorkspaceActivityResult> {
  const supabase = await createClient();

  const [projectsResult, sessionsResult, artifactsResult, sourcesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, archived_at, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(PER_ENTITY_FETCH_LIMIT),
    supabase
      .from("sessions")
      .select("id, project_id, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(PER_ENTITY_FETCH_LIMIT),
    supabase
      .from("artifacts")
      .select("id, project_id, title, status, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(PER_ENTITY_FETCH_LIMIT),
    supabase
      .from("sources")
      .select("id, project_id, title, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(PER_ENTITY_FETCH_LIMIT)
  ]);

  const error =
    projectsResult.error ?? sessionsResult.error ?? artifactsResult.error ?? sourcesResult.error;

  if (error) {
    console.error("listWorkspaceActivity failed:", error.message);
    return { status: "error" };
  }

  const projects = projectsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
  const artifacts = artifactsResult.data ?? [];
  const sources = sourcesResult.data ?? [];

  const referencedProjectIds = Array.from(
    new Set([
      ...sessions.map((session) => session.project_id),
      ...artifacts.map((artifact) => artifact.project_id),
      ...sources.map((source) => source.project_id)
    ])
  );

  const projectNameById = await fetchProjectNames(supabase, workspaceId, referencedProjectIds);

  if (!projectNameById) {
    return { status: "error" };
  }

  const items: ActivityItem[] = [
    ...projects.map(projectItem),
    ...sessions.map((session) =>
      sessionItem(session, projectNameById.get(session.project_id) ?? "Unknown project")
    ),
    ...artifacts.map((artifact) =>
      artifactItem(artifact, projectNameById.get(artifact.project_id) ?? "Unknown project")
    ),
    ...sources.map((source) =>
      sourceItem(source, projectNameById.get(source.project_id) ?? "Unknown project")
    )
  ];

  items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return { status: "ready", items: items.slice(0, ACTIVITY_LIMIT) };
}
