const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const buildReceiptHTML = (transaction, tenant) => {
  const itemsHTML = transaction.transaction_items
    .map((item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f8;font-size:14px;color:#2d2d3a;">${item.product_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f8;text-align:center;font-size:14px;color:#666;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f8;text-align:right;font-size:14px;color:#666;">${formatCurrency(item.price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f8;text-align:right;font-size:14px;font-weight:600;color:#2d2d3a;">${formatCurrency(item.subtotal)}</td>
      </tr>`)
    .join('');

  const customerRows = [];
  if (transaction.customer_name) {
    customerRows.push(`<tr><td style="padding:4px 0;font-size:13px;color:#888;width:100px;">Khách hàng</td><td style="padding:4px 0;font-size:13px;color:#2d2d3a;font-weight:600;">${transaction.customer_name}</td></tr>`);
  }
  if (transaction.customer_phone) {
    customerRows.push(`<tr><td style="padding:4px 0;font-size:13px;color:#888;">Số điện thoại</td><td style="padding:4px 0;font-size:13px;color:#2d2d3a;">${transaction.customer_phone}</td></tr>`);
  }
  if (transaction.customer_email) {
    customerRows.push(`<tr><td style="padding:4px 0;font-size:13px;color:#888;">Email</td><td style="padding:4px 0;font-size:13px;color:#2d2d3a;">${transaction.customer_email}</td></tr>`);
  }

  const paymentLabel = { cash: 'Tiền mặt', card: '💳 Thẻ ngân hàng', transfer: '🏦 Chuyển khoản' };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Hóa đơn ${transaction.transaction_code}</title>
</head>
<body style="margin:0;padding:20px;background:#f0f0f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.1);">

    <!-- Header gradient -->
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#2d1b69 50%,#1a1a2e 100%);padding:36px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;background:rgba(167,139,250,0.2);border-radius:14px;margin-bottom:12px;">
        <span style="font-size:24px;">👟</span>
      </div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px;">${tenant.name}</h1>
      ${tenant.address ? `<p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">${tenant.address}</p>` : ''}
      ${tenant.phone ? `<p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">📞 ${tenant.phone}</p>` : ''}
    </div>

    <!-- Receipt badge -->
    <div style="background:#f8f7ff;padding:14px 32px;text-align:center;border-bottom:1px solid #eeeeff;">
      <span style="font-size:11px;font-weight:700;color:#7c3aed;letter-spacing:2px;text-transform:uppercase;">🧾 HÓA ĐƠN THANH TOÁN</span>
    </div>

    <!-- Transaction meta -->
    <div style="padding:20px 32px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #f0f0f8;">
      <div>
        <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Mã hóa đơn</div>
        <div style="font-size:17px;font-weight:700;color:#1a1a2e;font-family:monospace;letter-spacing:1px;">${transaction.transaction_code}</div>
      </div>
      <div style="text-align:right;flex:1;padding-left:60px;">
        <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Thời gian</div>
        <div style="font-size:13px;color:#444;margin-bottom:8px;">${formatDate(transaction.created_at)}</div>
        <div style="display:inline-block;background:#f0eeff;color:#7c3aed;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">
          ${paymentLabel[transaction.payment_method] || transaction.payment_method}
        </div>
      </div>
    </div>

    <!-- Customer info (if any) -->
    ${customerRows.length ? `
    <div style="padding:16px 32px;border-bottom:1px solid #f0f0f8;background:#fafafe;">
      <table style="border-collapse:collapse;">${customerRows.join('')}</table>
    </div>` : ''}

    <!-- Items table -->
    <div style="padding:0 32px;">
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f8f7ff;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Sản phẩm</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;">SL</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Đơn giá</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:0 32px 28px;">
      <div style="border-top:1px solid #f0f0f8;padding-top:16px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
          <tr>
            <td style="font-size:14px;color:#888;padding:6px 0;">Tạm tính:</td>
            <td style="text-align:right;font-size:14px;font-weight:500;color:#444;">${formatCurrency(transaction.subtotal)}</td>
          </tr>
          ${transaction.tax > 0 ? `
          <tr>
            <td style="font-size:14px;color:#888;padding:6px 0;">Thuế:</td>
            <td style="text-align:right;font-size:14px;font-weight:500;color:#f59e0b;">+${formatCurrency(transaction.tax)}</td>
          </tr>` : ''}
          ${transaction.discount > 0 ? `
          <tr>
            <td style="font-size:14px;color:#888;padding:6px 0;">Giảm giá:</td>
            <td style="text-align:right;font-size:14px;font-weight:500;color:#10b981;">-${formatCurrency(transaction.discount)}</td>
          </tr>` : ''}
        </table>
        <div style="display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#1a1a2e,#2d1b69);padding:18px 20px;border-radius:14px;margin-top:14px;">
          <span style="color:#fff;font-size:16px;font-weight:700;">TỔNG CỘNG</span>
          <span style="color:#c4b5fd;font-size:24px;font-weight:800;text-align:right;">${formatCurrency(transaction.total)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8f7ff;padding:20px 32px;text-align:center;border-top:1px solid #eeeeff;">
      <p style="margin:0;color:#888;font-size:13px;">Cảm ơn quý khách đã mua sắm tại <strong style="color:#7c3aed;">${tenant.name}</strong></p>
      <p style="margin:8px 0 0;color:#bbb;font-size:11px;">Hóa đơn được tạo tự động · Vui lòng giữ để đổi/trả hàng trong 7 ngày</p>
    </div>
  </div>
</body>
</html>`;
};

const emailService = {
  async sendReceipt(toEmail, transaction, tenant) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return false;
    }

    const transporter = createTransporter();
    const html = buildReceiptHTML(transaction, tenant);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"${tenant.name}" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🧾 Hóa đơn ${transaction.transaction_code} - ${tenant.name}`,
      html,
    });

    return true;
  },

  async verifyConnection() {
    const transporter = createTransporter();
    return transporter.verify();
  },
};

module.exports = emailService;