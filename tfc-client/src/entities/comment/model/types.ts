export interface Comment {
  id: number;
  body: string;
  createdAt: string; // ISO date
  taskId: number;
  authorId: number;
  // Optional nested author information, if provided by backend as per OpenAPI
  author?: {
    id: number;
    name: string;
  };
}

export interface CreateCommentPayload {
  taskId: number;
  body: string;
}
