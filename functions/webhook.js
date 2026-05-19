import crypto from 'crypto';

const SERVER_KEY = "SB-Mid-server-CyKGMYV99Y-uQX8Cdhnewuxy";

/**
 * Verifikasi signature dari Midtrans
 * @param {Object} notification - Data notifikasi dari Midtrans
 * @param {string} signature - Signature yang dikirim Midtrans
 * @returns {boolean} - Apakah signature valid
 */
function verifySignature(notification, signature) {
  const orderId = notification.order_id;
  const statusCode = notification.status_code;
  const grossAmount = notification.gross_amount;

  // Generate signature sesuai dokumentasi Midtrans
  const signatureKey = `${orderId}${statusCode}${grossAmount}${SERVER_KEY}`;
  const generatedSignature = crypto
    .createHash('sha512')
    .update(signatureKey)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Endpoint webhook untuk menerima notifikasi pembayaran dari Midtrans
 */
export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();

    console.log('Webhook notification received:', body);

    // Verifikasi signature untuk memastikan notifikasi dari Midtrans yang asli
    if (!verifySignature(body, body.signature_key)) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Proses notifikasi berdasarkan transaction status
    const { transaction_status, order_id, transaction_id } = body;

    // Simpan data transaksi ke database (sesuaikan dengan setup database Anda)
    await handleTransactionStatus(order_id, transaction_status, body);

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
 */
async function handleTransactionStatus(orderId, transactionStatus, notification) {
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
      // Pembayaran berhasil
      orderStatus = 'completed';
      message = `Pembayaran untuk order ${orderId} berhasil`;
      // TODO: Update order status di database ke 'completed'
      // TODO: Kirim email konfirmasi ke customer
      // TODO: Update inventory/stock
      break;

    case 'pending':
      // Pembayaran masih pending (menunggu)
      orderStatus = 'pending';
      message = `Pembayaran untuk order ${orderId} masih menunggu`;
      // TODO: Kirim email reminder ke customer
      break;

    case 'deny':
      // Pembayaran ditolak
      orderStatus = 'failed';
      message = `Pembayaran untuk order ${orderId} ditolak`;
      // TODO: Update order status ke 'failed'
      // TODO: Kirim email notifikasi pembayaran ditolak
      break;

    case 'expire':
      // Pembayaran expired
      orderStatus = 'expired';
      message = `Pembayaran untuk order ${orderId} expired`;
      // TODO: Update order status ke 'expired'
      // TODO: Bersihkan/cancel order
      break;

    case 'cancel':
      // Pembayaran dibatalkan
      orderStatus = 'cancelled';
      message = `Pembayaran untuk order ${orderId} dibatalkan`;
      // TODO: Update order status ke 'cancelled'
      break;

    default:
      console.warn(`Unknown transaction status: ${transactionStatus}`);
  }

  // Log untuk debugging
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

  // TODO: Implementasi penyimpanan ke database
  // Contoh:
  // await saveTransactionToDatabase({
  //   orderId,
  //   transactionId: transaction_id,
  //   transactionStatus,
  //   orderStatus,
  //   grossAmount: gross_amount,
  //   paymentType,
  //   bank,
  //   fraudStatus,
  //   customerEmail: customer_details?.email,
  //   notification: JSON.stringify(notification),
  //   createdAt: new Date()
  // });
}
