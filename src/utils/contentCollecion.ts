import { type CollectionEntry, getCollection } from "astro:content";

export const getSortedBlogs = async (): Promise<CollectionEntry<"blog">[]> => {
  const blogs = await getCollection("blog");
  return blogs.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );
};
