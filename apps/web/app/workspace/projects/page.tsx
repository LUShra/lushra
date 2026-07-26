import { Stack, Text } from "@lushra/ui";

import { PageFrame } from "@/components/layout/page-frame";
import { CreateProjectForm } from "@/features/projects/create-project-form";
import { listProjects } from "@/features/projects/list-projects";
import { ProjectListItem } from "@/features/projects/project-list-item";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";

export default async function WorkspaceProjectsPage() {
  const workspaceResult = await getOrCreatePersonalWorkspace();

  if (workspaceResult.status === "error") {
    return (
      <PageFrame
        description="Projects are the durable containers for your work."
        eyebrow="Workspace"
        title="Projects"
      >
        <Text color="secondary">
          We couldn&apos;t load your workspace right now. Try reloading the page.
        </Text>
      </PageFrame>
    );
  }

  const { workspace } = workspaceResult;
  const projectsResult = await listProjects(workspace.id);

  return (
    <PageFrame
      description="Projects are the durable containers for your work."
      eyebrow="Workspace"
      title="Projects"
    >
      <Stack gap={8}>
        <CreateProjectForm workspaceId={workspace.id} />

        {projectsResult.status === "error" ? (
          <Text color="secondary">
            We couldn&apos;t load your projects right now. Try reloading the page.
          </Text>
        ) : projectsResult.projects.length === 0 ? (
          <Text color="secondary">No projects yet. Create your first project above.</Text>
        ) : (
          <Stack gap={4}>
            {projectsResult.projects.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
          </Stack>
        )}
      </Stack>
    </PageFrame>
  );
}
