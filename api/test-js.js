// Simple JavaScript test (no TypeScript)
export default async function handler(req, res) {
  console.log('JS test handler called!', req.method);
  return res.json({ 
    message: 'JavaScript test works!',
    timestamp: new Date().toISOString(),
    method: req.method 
  });
}

