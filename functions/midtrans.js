export async function onRequestPost(context) {
  try {
    const { request } = context;
    const origin = new URL(request.url).origin;
    const body = await request.json();

    const storeId = body.storeId || 'default';
    const waNumber = body.waNumber || '';

    // Bangun finish URL menuju halaman sukses universal
    const successBaseUrl = 'https://vems-olshop.pages.dev/success';
    const params = new URLSearchParams();
    if (storeId) params.append('vems_store', storeId);
    if (waNumber) params.append('wa', waNumber);
    const finishUrl = params.toString() ? `${successBaseUrl}?${params.toString()}` : successBaseUrl;

    const response = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa("{{site.SERVER_KEY}}" + ":"),
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
