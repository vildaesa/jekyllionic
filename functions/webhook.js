// Tidak perlu import node:crypto di Cloudflare Workers
// cukup gunakan crypto global bawaan

/**
 * Verifikasi signature dari Midtrans menggunakan Web Crypto API
 * @param {Object} notification - Data notifikasi dari Midtrans
 * @param {string} signature - Signature yang dikirim Midtrans
 * @param {string} serverKey - Server key Midtrans dari environment
 * @returns {Promise<boolean>} - Apakah signature valid
 */
async function verifySignature(notification, signature, serverKey) {
  const orderId = notification.order_id;
  const statusCode = notification.status_code;
  const grossAmount = notification.gross_amount;

  // Generate signature sesuai dokumentasi Midtrans
  const signatureKey = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  
  // Hash dengan SHA-512 menggunakan Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureKey);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const generatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return generatedSignature === signature;
}

/**
 * Endpoint webhook untuk menerima notifikasi pembayaran dari Midtrans
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context; // ambil env dari context
    const body = await request.json();

    console.log('Webhook notification received:', body);

    // Ambil server key dari environment
    const serverKey = env.SERVER_KEY;
    if (!serverKey) {
      console.error('Missing SERVER_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Server key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verifikasi signature untuk memastikan notifikasi dari Midtrans yang asli
    const isValid = await verifySignature(body, body.signature_key, serverKey);
    if (!isValid) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Proses notifikasi berdasarkan transaction status
    const { transaction_status, order_id, transaction_id } = body;

    // Simpan data transaksi ke database (sesuaikan dengan setup database Anda)
    await handleTransactionStatus(order_id, transaction_status, body, env); // kirim env jika perlu

    // Respond dengan 200 OK agar Midtrans tahu notifikasi sudah diterima
    return new Response(
      JSON.stringify({ status: 'ok', message: 'Notification processed' }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle transaction status dari Midtrans
 * @param {string} orderId - Order ID
 * @param {string} transactionStatus - Status transaksi (settlement, pending, deny, expire, cancel, etc)
 * @param {Object} notification - Notification object lengkap dari Midtrans
 * @param {Object} env - Environment variables (opsional, jika perlu koneksi DB)
 */
async function handleTransactionStatus(orderId, transactionStatus, notification, env) {
  const { 
    transaction_id, 
    gross_amount, 
    payment_type,
    bank,
    merchant_id,
    fraud_status,
    customer_details
  } = notification;

  let orderStatus = 'pending';
  let message = '';

  switch (transactionStatus) {
    case 'capture':
    case 'settlement':
      orderStatus = 'completed';
      message = `Pembayaran untuk order ${orderId} berhasil`;
      // TODO: Update order status di database ke 'completed'
      // TODO: Kirim email konfirmasi ke customer
      // TODO: Update inventory/stock
      break;

    case 'pending':
      orderStatus = 'pending';
      message = `Pembayaran untuk order ${orderId} masih menunggu`;
      break;

    case 'deny':
      orderStatus = 'failed';
      message = `Pembayaran untuk order ${orderId} ditolak`;
      break;

    case 'expire':
      orderStatus = 'expired';
      message = `Pembayaran untuk order ${orderId} expired`;
      break;

    case 'cancel':
      orderStatus = 'cancelled';
      message = `Pembayaran untuk order ${orderId} dibatalkan`;
      break;

    default:
      console.warn(`Unknown transaction status: ${transactionStatus}`);
  }

  console.log(`[${orderStatus.toUpperCase()}] ${message}`);
  console.log(`Transaction details:`, {
    orderId,
    transactionId: transaction_id,
    amount: gross_amount,
    paymentType: payment_type,
    bank,
    fraudStatus: fraud_status,
    timestamp: new Date().toISOString()
  });

  // TODO: Implementasi penyimpanan ke database (gunakan env untuk koneksi)
  // Contoh dengan D1 atau KV:
  // if (env.DB) {
  //   await env.DB.prepare(`INSERT INTO ...`).run(...);
  // }
}