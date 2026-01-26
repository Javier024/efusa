export default async function handler(req, res) {
  res.status(200).json({
    database_url_exists: !!process.env.DATABASE_URL,
    starts_with: process.env.DATABASE_URL?.slice(0, 30)
  });
}
