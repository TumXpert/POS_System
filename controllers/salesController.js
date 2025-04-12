// controllers/salesController.js
const db = require('../config/db');

exports.createSale = async (req, res) => {
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const {
      items,
      total_amount,
      payment_method,
      amount_paid,
      cashier_id,
      customer_id,
      reference
    } = req.body;

    // Basic validations
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }
    if (!cashier_id || !payment_method || amount_paid == null || !total_amount || !customer_id) {
      return res.status(400).json({ message: 'Missing required sale fields' });
    }

    // 1. Validate customer
    const [customer] = await conn.execute('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (customer.length === 0) {
      return res.status(404).json({ message: `Customer with ID ${customer_id} not found` });
    }

    // 2. Check payment status
    let paymentStatus = 'successful';
    let overpaidAmount = 0;
    let remainingAmount = 0;

    if (amount_paid < total_amount) {
      paymentStatus = 'pending';
      remainingAmount = total_amount - amount_paid;
    } else if (amount_paid > total_amount) {
      overpaidAmount = amount_paid - total_amount;
    }

    // 3. Insert transaction
    const [transactionResult] = await conn.execute(
      'INSERT INTO transactions (user_id, total_amount, payment_method, transaction_time) VALUES (?, ?, ?, NOW())',
      [cashier_id, total_amount, payment_method]
    );
    const transaction_id = transactionResult.insertId;

    // 4. Add items to transaction & update stock
    for (const item of items) {
      const [product] = await conn.execute('SELECT stock FROM products WHERE id = ?', [item.product_id]);
      if (product.length === 0) throw new Error(`Invalid product_id: ${item.product_id}`);

      const currentStock = product[0].stock;
      if (currentStock < item.quantity) throw new Error(`Insufficient stock for product ID ${item.product_id}`);

      await conn.execute(
        'INSERT INTO transaction_items (transaction_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [transaction_id, item.product_id, item.quantity, item.price]
      );

      await conn.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 5. Insert payment (without amount_paid column)
    await conn.execute(
      'INSERT INTO payments (transaction_id, method, status, reference, paid_at) VALUES (?, ?, ?, ?, NOW())',
      [transaction_id, payment_method, paymentStatus, reference || null]
    );

    // 6. Handle overpayment
    const { sendEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');

// ...

if (overpaidAmount > 0) {
  await conn.execute(
    'UPDATE customers SET credit = IFNULL(credit, 0) + ? WHERE id = ?',
    [overpaidAmount, customer_id]
  );

  // Optional notification
  const emailMsg = `Hello ${customer[0].name}, you have overpaid by ${overpaidAmount}. Your credit has been saved for future purchases.`;
  const smsMsg = `Overpayment of ${overpaidAmount} saved as credit.`;

  if (customer[0].email) await sendEmail(customer[0].email, 'Overpayment Notice', emailMsg);
  if (customer[0].phone) await sendSMS(customer[0].phone, smsMsg);
}

if (remainingAmount > 0) {
  const emailMsg = `Hello ${customer[0].name}, you still owe ${remainingAmount} for your recent transaction. Please pay the balance.`;
  const smsMsg = `You owe ${remainingAmount}. Kindly clear your balance.`;

  if (customer[0].email) await sendEmail(customer[0].email, 'Pending Balance Notice', emailMsg);
  if (customer[0].phone) await sendSMS(customer[0].phone, smsMsg);
}


    // 7. Award loyalty points based on total_amount only
    let pointsEarned = 0;
    if (customer[0].shop_card_number) {
      pointsEarned = Math.floor(total_amount / 10);
      console.log(`Awarding ${pointsEarned} points to customer ${customer_id}`);

      await conn.execute(
        'UPDATE customers SET points = IFNULL(points, 0) + ? WHERE id = ?',
        [pointsEarned, customer_id]
      );
    }

    await conn.commit();
    conn.release();

    // 8. Send final response
    res.status(201).json({
      message: 'Sale recorded successfully',
      transaction_id,
      payment_status: paymentStatus,
      overpaidAmount,
      remainingAmount,
      pointsEarned
    });

  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Transaction failed:', err.message);
    res.status(500).json({ message: 'Transaction failed', error: err.message });
  }
};
