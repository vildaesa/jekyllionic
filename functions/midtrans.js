export async function onRequestPost(context) {
  try {
    const { request } = context;
    const origin = new URL(request.url).origin;
    const body = await request.json();

    // Ambil store identifier dari request body (dikirim dari frontend)
    const storeId = body.storeId || '';        // misal: 'tokoA', 'premium', dll
    const waNumber = body.waNumber || '';      // opsional: langsung nomor WA

    // Bangun finish URL dengan parameter
    let finishUrl = `${origin}/success`;
    const params = new URLSearchParams();
    if (storeId) params.append('store', storeId);
    if (waNumber) params.append('wa', waNumber);
    if (params.toString()) finishUrl += `?${params.toString()}`;

    const response = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa("SB-Mid-server-CyKGMYV99Y-uQX8Cdhnewuxy" + ":"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: "order-" + Date.now(),
          gross_amount: body.total
        },
        item_details: body.items,
        customer_details: {
          first_name: body.customer.first_name,
          last_name: body.customer.last_name,
          email: body.customer.email,
          billing_address: {
            ...body.customer.address
          }
        },
        callbacks: {
          finish: finishUrl
        }
      })
    });

    const snap = await response.json();
    return new Response(JSON.stringify(snap), {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}