export default function handler(req, res) {
  if (req.method === 'POST') {
    console.log('🐛 DEBUG LOG:', JSON.stringify(req.body, null, 2))
    res.status(200).json({ success: true })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}