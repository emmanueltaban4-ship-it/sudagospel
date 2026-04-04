import Layout from "@/components/Layout";
import NewsCard from "@/components/NewsCard";

const allNews = [
  {
    title: "National Gospel Music Festival Coming to Juba This December",
    excerpt: "The biggest gospel music event in South Sudan returns with performances from top artists across the country.",
    date: "Mar 28, 2026",
    category: "Events",
  },
  {
    title: "New Worship Album Released by Grace Worship Band",
    excerpt: "The acclaimed worship group drops their third studio album featuring 12 powerful tracks.",
    date: "Mar 25, 2026",
    category: "Music",
  },
  {
    title: "How Gospel Music Is Uniting South Sudan's Youth",
    excerpt: "A deep dive into the role of gospel music in bringing together young people across different communities.",
    date: "Mar 22, 2026",
    category: "Inspiration",
  },
  {
    title: "Top 10 Most Streamed Gospel Songs of 2026",
    excerpt: "From traditional hymns to modern worship, these songs have captured the hearts of listeners nationwide.",
    date: "Mar 18, 2026",
    category: "Music",
  },
  {
    title: "Youth Worship Conference Announced for April",
    excerpt: "Registration is now open for the annual youth worship conference in Juba with guest speakers from across East Africa.",
    date: "Mar 15, 2026",
    category: "Events",
  },
  {
    title: "The Power of Praise: Stories of Transformation",
    excerpt: "Real testimonies from people whose lives were changed through gospel music and worship.",
    date: "Mar 12, 2026",
    category: "Inspiration",
  },
];

const NewsPage = () => {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-6">
          📰 Gospel News & Blog
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allNews.map((news) => (
            <NewsCard key={news.title} {...news} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default NewsPage;
