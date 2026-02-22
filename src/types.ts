export type Recipe = {
    id: number;
    slug: string;
    title: string;
    markdown: string;
    author: string;
    created_at: string;
    tags: Tag[];
}

export type Tag = {
    id: number;
    name: string;
}