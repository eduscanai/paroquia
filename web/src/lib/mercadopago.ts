import { MercadoPagoConfig, Payment } from "mercadopago";

const config = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
  options: { timeout: 10_000 },
});

export const mpPayment = new Payment(config);
