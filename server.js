import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { webcrypto } from 'node:crypto';
import { Resend } from 'resend';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);
const resend = new Resend(process.env.RESEND_API_KEY);

async function hashPassword(password) {
  if (!password) return password;
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- USERS ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await sql`SELECT id, name, email, phone, role, "aptId", "residentType", block, "flatNo", "createdAt" FROM users`;
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const users = await sql`SELECT id, name, email, phone, role, "aptId", "residentType", block, "flatNo", "createdAt" FROM users WHERE id = ${req.params.id}`;
    res.json(users.length > 0 ? users[0] : null);
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPass = await hashPassword(password);
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (users.length > 0 && users[0].password === hashedPass) {
      const { password: _, ...user } = users[0];
      res.json(user);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const data = req.body;
    
    if (data.email) {
      const emailDomain = data.email.split('@')[1]?.toLowerCase();
      const allowedDomains = ['gmail.com', 'icloud.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yandex.com', 'msn.com', 'live.com'];
      if (!allowedDomains.includes(emailDomain)) {
        return res.status(400).json({ error: 'Sadece geçerli, bilinen e-posta sağlayıcılarıyla kayıt olabilirsiniz.' });
      }
    }

    const existingEmail = await sql`SELECT id FROM users WHERE email = ${data.email}`;
    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kullanımda' });
    }
    await sql`
      INSERT INTO users (id, name, email, password, phone, role, "aptId", "residentType", block, "flatNo", "createdAt")
      VALUES (${data.id}, ${data.name}, ${data.email}, ${data.password}, ${data.phone || null}, ${data.role}, ${data.aptId}, ${data.residentType || null}, ${data.block || null}, ${data.flatNo || null}, ${data.createdAt})
    `;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const data = req.body;
    const keys = Object.keys(data);
    for (const key of keys) {
      if (key === 'id') continue;
      if (['name', 'email', 'password', 'phone', 'role', 'aptId', 'residentType', 'block', 'flatNo', 'createdAt'].includes(key)) {
        if (key === 'aptId') await sql`UPDATE users SET "aptId" = ${data[key]} WHERE id = ${req.params.id}`;
        else if (key === 'residentType') await sql`UPDATE users SET "residentType" = ${data[key]} WHERE id = ${req.params.id}`;
        else if (key === 'flatNo') await sql`UPDATE users SET "flatNo" = ${data[key]} WHERE id = ${req.params.id}`;
        else if (key === 'createdAt') await sql`UPDATE users SET "createdAt" = ${data[key]} WHERE id = ${req.params.id}`;
        else if (key === 'name') await sql`UPDATE users SET name = ${data[key]} WHERE id = ${req.params.id}`;
        else if (key === 'email') await sql`UPDATE users SET email = ${data[key]} WHERE id = ${req.params.id}`;
        else if (key === 'password') await sql`UPDATE users SET password = ${data[key]} WHERE id = ${req.params.id}`;
        else if (key === 'phone') await sql`UPDATE users SET phone = ${data[key]} WHERE id = ${req.params.id}`;
        else if (key === 'role') await sql`UPDATE users SET role = ${data[key]} WHERE id = ${req.params.id}`;
        else if (key === 'block') await sql`UPDATE users SET block = ${data[key]} WHERE id = ${req.params.id}`;
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await sql`DELETE FROM users WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// --- AUTH (PASSWORD RESET) ---
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const users = await sql`SELECT id, name FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.status(404).json({ error: 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.' });
    }
    
    const user = users[0];
    const resetToken = crypto.randomUUID();
    const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins
    
    await sql`UPDATE users SET "resetToken" = ${resetToken}, "resetTokenExpiry" = ${expiry} WHERE id = ${user.id}`;
    
    const resetLink = \`https://komsucep.perainc.online/reset-password?token=\${resetToken}\`;
    
    await resend.emails.send({
      from: 'noreply@mail.perainc.online',
      to: email,
      subject: 'Şifre Sıfırlama İsteği',
      html: \`<p>Merhaba \${user.name},</p>
             <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın. Bu bağlantı 30 dakika boyunca geçerlidir.</p>
             <p><a href="\${resetLink}">Şifremi Sıfırla</a></p>\`
    });
    
    res.json({ success: true, message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const users = await sql`SELECT id FROM users WHERE "resetToken" = ${token} AND "resetTokenExpiry" > NOW()`;
    if (users.length === 0) {
      return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı.' });
    }
    
    const user = users[0];
    const hashedPass = await hashPassword(newPassword);
    
    await sql`UPDATE users SET password = ${hashedPass}, "resetToken" = NULL, "resetTokenExpiry" = NULL WHERE id = ${user.id}`;
    
    res.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// --- APARTMENTS ---
app.get('/api/apartments/code/:code', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM apartments WHERE code = ${req.params.code}`;
    res.json(result.length > 0 ? result[0] : null);
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

app.get('/api/apartments/:id', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM apartments WHERE id = ${req.params.id}`;
    res.json(result.length > 0 ? result[0] : null);
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

app.post('/api/apartments/:id', async (req, res) => {
  try {
    const aptId = req.params.id;
    const aptData = req.body;
    const existing = await sql`SELECT id FROM apartments WHERE id = ${aptId}`;
    const blocksVal = Array.isArray(aptData.blocks) ? JSON.stringify(aptData.blocks) : (typeof aptData.blocks === 'string' ? aptData.blocks : null);
    if (existing.length > 0) {
      await sql`UPDATE apartments SET name = ${aptData.name}, code = ${aptData.code}, "flatsCount" = ${aptData.flatsCount || null}, blocks = ${blocksVal}, "monthlyDues" = ${aptData.monthlyDues || 0} WHERE id = ${aptId}`;
    } else {
      const existingCode = await sql`SELECT id FROM apartments WHERE code = ${aptData.code}`;
      if (existingCode.length > 0) {
        return res.status(409).json({ error: 'Bu apartman kodu zaten kullanımda' });
      }
      await sql`INSERT INTO apartments (id, name, code, "flatsCount", blocks, "monthlyDues", "createdBy", "createdAt") 
                VALUES (${aptId}, ${aptData.name}, ${aptData.code}, ${aptData.flatsCount || null}, ${blocksVal}, ${aptData.monthlyDues || 0}, ${aptData.createdBy}, ${aptData.createdAt})`;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('saveApartment error:', error.message);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

app.delete('/api/apartments/:id', async (req, res) => {
  try {
    const aptId = req.params.id;
    await sql`DELETE FROM apartments WHERE id = ${aptId}`;
    await sql`DELETE FROM users WHERE "aptId" = ${aptId}`;
    await sql`DELETE FROM transactions WHERE "aptId" = ${aptId}`;
    await sql`DELETE FROM announcements WHERE "aptId" = ${aptId}`;
    await sql`DELETE FROM requests WHERE "aptId" = ${aptId}`;
    await sql`DELETE FROM repairs WHERE "aptId" = ${aptId}`;
    await sql`DELETE FROM polls WHERE "aptId" = ${aptId}`;
    await sql`DELETE FROM dues WHERE "aptId" = ${aptId}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Generic sync for array tables (transactions, announcements, etc.)
const syncTable = async (tableName, req, res) => {
  try {
    const aptId = req.params.aptId;
    const dataArray = req.body;
    await sql.query(`DELETE FROM "${tableName}" WHERE "aptId" = $1`, [aptId]);
    
    for (const item of dataArray) {
      if (tableName === 'transactions') {
        await sql.query(
          `INSERT INTO transactions (id, "aptId", type, amount, "createdAt", category, description, "receiptUrl", "userId")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [item.id, aptId, item.type, item.amount, item.createdAt || new Date().toISOString(), item.category, item.description || null, item.receiptUrl || null, item.userId || null]
        );
      } else if (tableName === 'announcements') {
        await sql.query(
          `INSERT INTO announcements (id, "aptId", title, content, "createdAt", "readBy", type, duration)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [item.id, aptId, item.title, item.content, item.createdAt || new Date().toISOString(), JSON.stringify(item.readBy || []), item.type || null, item.duration || 7]
        );
      } else if (tableName === 'requests') {
        await sql.query(
          `INSERT INTO requests (id, "aptId", "userId", title, description, status, "createdAt", progress, "completedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [item.id, aptId, item.userId, item.title, item.description || null, item.status, item.createdAt || new Date().toISOString(), JSON.stringify(item.progress || []), item.completedAt || null]
        );
      } else if (tableName === 'repairs') {
        await sql.query(
          `INSERT INTO repairs (id, "aptId", title, description, status, cost, "createdAt", progress, "resolvedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [item.id, aptId, item.title, item.description || null, item.status, item.cost || null, item.createdAt || new Date().toISOString(), JSON.stringify(item.progress || []), item.resolvedAt || null]
        );
      } else if (tableName === 'polls') {
        await sql.query(
          `INSERT INTO polls (id, "aptId", question, options, votes, "createdBy", "createdAt", active, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [item.id, aptId, item.question, JSON.stringify(item.options), JSON.stringify(item.votes || {}), item.createdBy, item.createdAt || new Date().toISOString(), item.active !== false, item.status || 'approved']
        );
      } else if (tableName === 'dues') {
        await sql.query(
          `INSERT INTO dues (id, "aptId", "userId", month, year, amount, status, "paidAt", "transactionId", "bulkTransactionId")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [item.id, aptId, item.userId, item.month, item.year, item.amount, item.status, item.paidAt || null, item.transactionId || null, item.bulkTransactionId || null]
        );
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

const getTable = async (tableName, req, res) => {
  try {
    const result = await sql.query(
      `SELECT * FROM "${tableName}" WHERE "aptId" = $1`,
      [req.params.aptId]
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

['transactions', 'announcements', 'requests', 'repairs', 'polls', 'dues'].forEach(table => {
  app.get(`/api/${table}/:aptId`, (req, res) => getTable(table, req, res));
  app.post(`/api/${table}/:aptId`, (req, res) => syncTable(table, req, res));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
