import { Card, Heading, Inline, Stack, Text } from "@lushra/ui";
import Link from "next/link";

import { PageFrame } from "@/components/layout/page-frame";
import { SearchForm } from "@/features/search/search-form";
import { searchWorkspace } from "@/features/search/search-workspace";
import { getOrCreatePersonalWorkspace } from "@/features/workspace/get-or-create-personal-workspace";

type WorkspaceSearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

type SearchResultsProps = {
  query: string;
  workspaceId: string;
};

async function SearchResults({ query, workspaceId }: SearchResultsProps) {
  const result = await searchWorkspace(workspaceId, query);

  if (result.status === "error") {
    return <Text color="secondary">We couldn&apos;t run that search right now. Try again.</Text>;
  }

  const { projects, artifacts, sources } = result.results;

  if (projects.length === 0 && artifacts.length === 0 && sources.length === 0) {
    return <Text color="secondary">No results for &ldquo;{query}&rdquo;.</Text>;
  }

  return (
    <Stack gap={8}>
      {projects.length > 0 ? (
        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Projects
            </Heading>

            <Stack gap={3}>
              {projects.map((project) => (
                <Card key={project.id} variant="raised">
                  <Link href={`/workspace/projects/${project.id}`}>{project.name}</Link>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>
      ) : null}

      {artifacts.length > 0 ? (
        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Artifacts
            </Heading>

            <Stack gap={3}>
              {artifacts.map((artifact) => (
                <Card key={artifact.id} variant="raised">
                  <Inline align="center" gap={4} justify="between">
                    <Link
                      href={`/workspace/projects/${artifact.project_id}/artifacts/${artifact.id}`}
                    >
                      {artifact.title}
                    </Link>
                    <Text color="secondary">{artifact.projectName}</Text>
                  </Inline>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>
      ) : null}

      {sources.length > 0 ? (
        <Card variant="inset">
          <Stack gap={4}>
            <Heading level={2} visualRole="heading-4">
              Sources
            </Heading>

            <Stack gap={3}>
              {sources.map((source) => (
                <Card key={source.id} variant="raised">
                  <Inline align="center" gap={4} justify="between">
                    <Link href={`/workspace/projects/${source.project_id}`}>{source.title}</Link>
                    <Text color="secondary">{source.projectName}</Text>
                  </Inline>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}

export default async function WorkspaceSearchPage({ searchParams }: WorkspaceSearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const workspaceResult = await getOrCreatePersonalWorkspace();

  if (workspaceResult.status === "error") {
    return (
      <PageFrame eyebrow="Workspace" title="Search">
        <Text color="secondary">
          We couldn&apos;t load your workspace right now. Try reloading the page.
        </Text>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      description="Search projects, artifacts, and sources across your workspace."
      eyebrow="Workspace"
      title="Search"
    >
      <Stack gap={8}>
        <SearchForm defaultValue={query} />

        {query ? (
          <SearchResults query={query} workspaceId={workspaceResult.workspace.id} />
        ) : (
          <Text color="secondary">Enter a search term to get started.</Text>
        )}
      </Stack>
    </PageFrame>
  );
}
