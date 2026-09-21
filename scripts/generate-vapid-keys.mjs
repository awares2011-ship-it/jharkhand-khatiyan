// Prints a fresh VAPID keypair for Web Push. Run with: npm run vapid
// Copy the output into .env.local as NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.
import webpush from 'web-push'

const { publicKey, privateKey } = webpush.generateVAPIDKeys()
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + publicKey)
console.log('VAPID_PRIVATE_KEY=' + privateKey)
