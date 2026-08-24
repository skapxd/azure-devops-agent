/** Lo que devuelve Azure DevOps tras crear un work item, ya normalizado. */
export interface WorkItemCreado {
  readonly id: number;
  readonly title: string;
  readonly parent: string;
  readonly url: string;
}
