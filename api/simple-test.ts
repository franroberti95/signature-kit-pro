// Ultra-simple test - no imports that could fail
export default async function handler(req: any, res: any) {
  console.log('Simple test handler called!', req.method, req.url);
  return res.json({ 
    message: 'Simple test works!',
    timestamp: new Date().toISOString(),
    method: req.method 
  });
}

