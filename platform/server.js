import fs from 'node:fs/promises'
import express from 'express'
import { Transform } from 'node:stream'

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : ''
const ssrManifest = isProduction
  ? await fs.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8')
  : undefined

// Create http server
const app = express()

// Parse JSON bodies for API routes
app.use(express.json())

// Security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; frame-src 'self' https://js.stripe.com https://m.stripe.network; connect-src 'self' https://api.stripe.com wss: ws: https:;");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Required for some Stripe inner frames, or DENY
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
})

// Stripe backend setup
let stripeClient;
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = (await import('stripe')).default;
  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
}

// API Routes
app.post('/api/create-payment-intent', async (req, res) => {
  if (!stripeClient) {
    return res.status(500).json({ error: 'Stripe is not configured on the server.' });
  }
  
  try {
    const { amountCents, itemName } = req.body;
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      description: itemName,
      // In a real app, you'd probably pass automatic_payment_methods: { enabled: true }
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add Vite or respective production middlewares
let vite
if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv('./dist/client', { extensions: [] }))
}

// Serve HTML
app.use(async (req, res) => {
  try {
    let url = req.originalUrl
    if (base !== '/' && url.startsWith(base)) {
      url = url.replace(base, '')
    }
    if (!url.startsWith('/')) {
      url = '/' + url
    }

    let template
    let render
    if (!isProduction) {
      // Always read fresh template in dev
      template = await fs.readFile('./index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
    } else {
      template = templateHtml
      render = (await import('./dist/server/entry-server.js')).render
    }

    const [htmlStart, htmlEnd] = template.split('<!--ssr-outlet-->')

    const { pipe } = render(url, {
      onShellReady() {
        res.status(200).set({ 'Content-Type': 'text/html' })
        res.write(htmlStart)
        
        const transformStream = new Transform({
          transform(chunk, encoding, callback) {
            callback(null, chunk)
          },
          flush(callback) {
            this.push(htmlEnd)
            callback()
          }
        })
        
        pipe(transformStream).pipe(res)
      },
      onShellError(err) {
        res.status(500).send(err.message)
      }
    })
    
  } catch (e) {
    vite?.ssrFixStacktrace(e)
    console.log(e.stack)
    res.status(500).end(e.stack)
  }
})

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})
